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

/** Upper bound for a single retry wait, in milliseconds. */
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
        // Retry per isRetryable(); retryOnRateLimit:false suppresses only rate_limited.
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

    // If we exhausted all retries, throw the last error
    throw lastError ?? new Error('Request failed after all retries');
  }

  /**
   * Send a `multipart/form-data` `POST` to a Notion file-upload URL. Reuses the
   * configured `fetch` and the request timeout. Does not retry. Does not set
   * `Content-Type`, so `fetch` adds the multipart boundary.
   *
   * @param uploadUrl - The absolute `upload_url` from `fileUploads.initiate()`.
   * @param form - A `FormData` body with the file bytes under the `file` key.
   * @throws {NotionAPIError} If the endpoint returns an error response.
   * @throws {NotionRequestTimeoutError} If the request exceeds the timeout.
   * @throws {NotionNetworkError} If a network problem blocks the request.
   */
  async sendFileUpload(uploadUrl: string, form: FormData): Promise<void> {
    const { 'Content-Type': _contentType, ...headers } = this.requestHeaders;

    try {
      const response = await this.fetchWithTimeout(uploadUrl, {
        method: 'POST',
        headers,
        body: form,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
    } catch (error) {
      this.mapTransportError(error);
    }
  }

  /**
   * Send one HTTP request to the Notion API.
   */
  private async makeRequest<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);

    try {
      const response = await this.fetchWithTimeout(url, {
        method: options.method,
        headers: this.requestHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

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
      this.mapTransportError(error);
    }
  }

  /**
   * Call the configured `fetch` with an abort timeout of `timeoutMs`.
   * Clear the timer as soon as the response headers arrive or the request fails.
   */
  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Map a transport-layer failure to the matching SDK error and throw it.
   * Rethrow a `NotionAPIError` unchanged. Map an `AbortError` to
   * `NotionRequestTimeoutError`. Map any other `Error` to `NotionNetworkError`.
   */
  private mapTransportError(error: unknown): never {
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
   * Parse the `Retry-After` response header into milliseconds, clamped to
   * {@link MAX_RETRY_DELAY_MS}. Return `undefined` if the header is missing or
   * not a valid non-negative number.
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
