import {
  NotionAPIError,
  type NotionErrorResponse,
  NotionNetworkError,
  NotionRequestTimeoutError,
} from './errors';

/**
 * The Notion API version this SDK uses.
 * All schemas, request bodies, helpers, and models depend on this version.
 *
 * @category Client & Core
 */
export const NOTION_VERSION = '2026-03-11' as const;

/**
 * Upper bound for a single retry wait, in milliseconds.
 * The client clamps both the `Retry-After` header value and the exponential
 * backoff delay to this value.
 */
const MAX_RETRY_DELAY_MS = 60_000;

/**
 * Configuration options for the Notion client.
 *
 * @category Client & Core
 */
export interface NotionClientOptions {
  /** Notion integration token (Bearer token) */
  auth: string;

  /** Base URL for API requests (default: https://api.notion.com) */
  baseUrl?: string;

  /** Request timeout in milliseconds (default: 60000) */
  timeoutMs?: number;

  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;

  /** Maximum number of retries for rate-limited requests (default: 3) */
  maxRetries?: number;

  /** Whether to retry rate-limited requests (default: true) */
  retryOnRateLimit?: boolean;
}

/**
 * Request options for API calls.
 */
export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
}

/**
 * Base HTTP client for Notion API requests.
 */
export class NotionClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private readonly retryOnRateLimit: boolean;
  private readonly requestHeaders: Record<string, string>;

  constructor(options: NotionClientOptions) {
    this.baseUrl = `${options.baseUrl ?? 'https://api.notion.com'}/v1`;
    this.timeoutMs = options.timeoutMs ?? 60000;
    this.fetchImpl = options.fetch ?? fetch;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryOnRateLimit = options.retryOnRateLimit ?? true;
    this.requestHeaders = {
      Authorization: `Bearer ${options.auth}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    };
  }

  /**
   * Send a request to the Notion API.
   * Retry automatically on rate-limited and overloaded responses.
   */
  async request<T>(options: RequestOptions): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.makeRequest<T>(options);
      } catch (error) {
        // Retry the errors that `NotionAPIError.isRetryable()` reports: rate limits,
        // service overload (529), and transient 5xx responses. `retryOnRateLimit`
        // still suppresses retries for `rate_limited` only.
        if (
          error instanceof NotionAPIError &&
          error.isRetryable() &&
          !(error.isRateLimited() && !this.retryOnRateLimit) &&
          attempt < this.maxRetries
        ) {
          // Prefer the server-supplied Retry-After value; fall back to
          // exponential backoff when the header is absent.
          const retryAfter = error.retryAfterMs ?? this.getRetryAfter(attempt);
          await this.sleep(retryAfter);
          lastError = error;
          continue;
        }

        // Don't retry other errors
        throw error;
      }
    }

    // Defensive: the loop always returns or throws before it reaches here,
    // because the final iteration hits `throw error`. Keep this as a safety net.
    throw lastError ?? new Error('Request failed after all retries');
  }

  /**
   * Send the raw bytes of a file to a Notion file-upload URL.
   *
   * The file-upload send endpoint uses `multipart/form-data`, not JSON. It is the
   * only Notion endpoint that does. This method reuses the configured `fetch`
   * implementation and the request timeout. It does not retry.
   *
   * Do not set a `Content-Type` header. The `fetch` implementation adds the
   * `multipart/form-data` header together with the correct boundary.
   *
   * @param uploadUrl - The absolute `upload_url` from `fileUploads.initiate()`.
   * @param form - A `FormData` body. Put the file bytes under the `file` key.
   * @throws {NotionAPIError} If the endpoint returns an error response.
   * @throws {NotionRequestTimeoutError} If the request exceeds the timeout.
   * @throws {NotionNetworkError} If a network problem blocks the request.
   */
  async sendFileUpload(uploadUrl: string, form: FormData): Promise<void> {
    const { 'Content-Type': _contentType, ...headers } = this.requestHeaders;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(uploadUrl, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NotionAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NotionRequestTimeoutError(`Request timed out after ${this.timeoutMs}ms`);
        }
        throw new NotionNetworkError('Network request failed', error);
      }

      throw error;
    }
  }

  /**
   * Send one HTTP request to the Notion API.
   */
  private async makeRequest<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: options.method,
        headers: this.requestHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NotionAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NotionRequestTimeoutError(`Request timed out after ${this.timeoutMs}ms`);
        }
        throw new NotionNetworkError('Network request failed', error);
      }

      throw error;
    }
  }

  /**
   * Calculate a fallback retry delay with exponential backoff.
   * Use this delay when the response has no `Retry-After` header.
   * Formula: 2^attempt * 1000 ms, capped at 60 seconds.
   */
  private getRetryAfter(attempt: number): number {
    const backoffMs = Math.pow(2, attempt) * 1000;
    return Math.min(backoffMs, MAX_RETRY_DELAY_MS);
  }

  /**
   * Pause for the given duration, in milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Build the full URL with query parameters.
   */
  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | string[] | undefined>,
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined) {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item) => url.searchParams.append(key, item));
        } else {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Parse the `Retry-After` response header into milliseconds.
   * Return `undefined` if the header is missing or not a valid non-negative number.
   * Clamp the value to {@link MAX_RETRY_DELAY_MS} so a bad header cannot stall a
   * request for minutes or hours.
   */
  private parseRetryAfterHeader(response: Response): number | undefined {
    const header = response.headers.get('Retry-After');
    if (header === null) {
      return undefined;
    }

    const seconds = Number(header);
    if (!Number.isFinite(seconds) || seconds < 0) {
      return undefined;
    }

    return Math.min(Math.ceil(seconds) * 1000, MAX_RETRY_DELAY_MS);
  }

  /**
   * Handle an error response from the API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const retryAfterMs = this.parseRetryAfterHeader(response);

    let errorBody: NotionErrorResponse;

    try {
      errorBody = (await response.json()) as NotionErrorResponse;
    } catch {
      // If we can't parse the error body, create a generic error
      errorBody = {
        object: 'error',
        status: response.status,
        code: 'internal_server_error',
        message: response.statusText || 'Unknown error occurred',
      };
    }

    throw new NotionAPIError(errorBody, retryAfterMs);
  }
}
