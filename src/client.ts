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
        // Retry rate-limited requests (if enabled) and service-overload (529)
        // responses, which the API recommends always retrying.
        if (
          error instanceof NotionAPIError &&
          ((error.isRateLimited() && this.retryOnRateLimit) || error.isServiceOverloaded()) &&
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
    return Math.min(backoffMs, 60000); // Cap at 60 seconds
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

    return Math.ceil(seconds) * 1000;
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
