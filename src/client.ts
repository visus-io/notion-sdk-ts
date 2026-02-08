import {
  NotionAPIError,
  type NotionErrorResponse,
  NotionNetworkError,
  NotionRequestTimeoutError,
} from './errors';

/**
 * Configuration options for the Notion client.
 */
export interface NotionClientOptions {
  /** Notion integration token (Bearer token) */
  auth: string;

  /** Base URL for API requests (default: https://api.notion.com) */
  baseUrl?: string;

  /** Notion API version (default: 2022-06-28) */
  notionVersion?: string;

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
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

/**
 * Base HTTP client for Notion API requests.
 */
export class NotionClient {
  private readonly auth: string;
  private readonly baseUrl: string;
  private readonly notionVersion: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private readonly retryOnRateLimit: boolean;

  constructor(options: NotionClientOptions) {
    this.auth = options.auth;
    this.baseUrl = options.baseUrl ?? 'https://api.notion.com';
    this.notionVersion = options.notionVersion ?? '2022-06-28';
    this.timeoutMs = options.timeoutMs ?? 60000;
    this.fetchImpl = options.fetch ?? fetch;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryOnRateLimit = options.retryOnRateLimit ?? true;
  }

  /**
   * Makes an HTTP request to the Notion API with retry logic for rate limits.
   */
  async request<T>(options: RequestOptions): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.makeRequest<T>(options);
      } catch (error) {
        // Only retry on rate limit errors if retry is enabled
        if (
          error instanceof NotionAPIError &&
          error.isRateLimited() &&
          this.retryOnRateLimit &&
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
   * Makes a single HTTP request to the Notion API.
   */
  private async makeRequest<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: options.method,
        headers,
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
   * Computes a fallback retry delay using exponential backoff.
   * Used when the `Retry-After` response header is absent.
   * Formula: 2^attempt * 1000 ms, capped at 60 seconds.
   */
  private getRetryAfter(attempt: number): number {
    const backoffMs = Math.pow(2, attempt) * 1000;
    return Math.min(backoffMs, 60000); // Cap at 60 seconds
  }

  /**
   * Sleeps for the specified duration in milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Builds the full URL with query parameters.
   */
  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.baseUrl}/v1${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Builds request headers.
   */
  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.auth}`,
      'Content-Type': 'application/json',
      'Notion-Version': this.notionVersion,
    };
  }

  /**
   * Parses the `Retry-After` response header into milliseconds.
   * Returns `undefined` when the header is absent or not a valid
   * non-negative integer.
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
   * Handles error responses from the API.
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
