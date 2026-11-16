import {
  NotionAPIError,
  type NotionErrorResponse,
  NotionNetworkError,
  NotionRequestTimeoutError,
} from './errors';
import { abortReason, sleep } from './sleep';
import { parseSseStream, type SseFrame } from './sse';
import { NotionValidationError } from './validation';

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

  /**
   * Whether to retry a `504 gateway_timeout` response automatically (default: `true`).
   * A `504` does not guarantee the original request failed. Set this to `false` for
   * a write that is not safe to repeat blindly, such as a non-idempotent content update.
   */
  retryOnGatewayTimeout?: boolean;

  /**
   * Whether to retry a `5xx` response automatically (default: `true`). Set this to `false`
   * for a write that must not run twice, such as a message to an agent. A `500`, `502`,
   * `503`, or `504` response can arrive after Notion accepted the write. The client still
   * retries a `429` and a `529 service_overload` response, because Notion did not process
   * the request.
   */
  retryOnServerError?: boolean;
}

/**
 * Request options for a streaming API call.
 */
export interface StreamRequestOptions extends RequestOptions {
  /** Abort the request and the stream. */
  signal?: AbortSignal;

  /**
   * The longest wait for the next body chunk, in milliseconds. When no data arrives in this
   * time, the stream throws `NotionNetworkError`. This detects a connection that dropped with
   * no signal. Omit it, or set `0`, to wait with no limit.
   */
  idleTimeoutMs?: number;
}

/**
 * Read one chunk. Reject with `NotionNetworkError` when no chunk arrives within
 * `idleTimeoutMs`. A missing or `0` value waits with no limit.
 */
function readWithIdleTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  idleTimeoutMs: number | undefined,
): ReturnType<ReadableStreamDefaultReader<Uint8Array>['read']> {
  if (!idleTimeoutMs) {
    return reader.read();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new NotionNetworkError(`The stream sent no data for ${idleTimeoutMs}ms`));
    }, idleTimeoutMs);
    reader.read().then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
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
    return this.withRetries(options, () => this.makeRequest<T>(options));
  }

  /**
   * Send a request that returns server-sent events, and yield each event.
   *
   * The client sends `Accept: text/event-stream`. It retries the connection the same way as
   * {@link request}. It does not retry after a success response arrives. The `timeoutMs`
   * timeout applies until the response headers arrive. It does not apply to the body. Use
   * `idleTimeoutMs` to limit the wait between two body chunks. When `signal`
   * aborts, the stream throws the abort reason before it yields the next frame. A response
   * with a `Content-Type` other than `text/event-stream` throws `NotionNetworkError`. A
   * response with no `Content-Type` is read as an event stream.
   *
   * @param options - The request, and an optional `signal` that stops the stream
   * @returns An async generator of server-sent events
   * @throws {NotionAPIError} If the endpoint returns an error response.
   * @throws {NotionRequestTimeoutError} If the response headers do not arrive within the timeout.
   * @throws {NotionNetworkError} If a network problem stops the connection or the body, or no
   * data arrives within `idleTimeoutMs`.
   */
  async *stream(options: StreamRequestOptions): AsyncGenerator<SseFrame> {
    const response = await this.withRetries(options, () => this.openStream(options));

    if (!response.body) {
      throw new NotionNetworkError('The stream response has no body');
    }

    // A proxy can answer with a success status and a page that is not an event stream.
    const contentType = response.headers.get('Content-Type');
    if (contentType !== null && !contentType.toLowerCase().startsWith('text/event-stream')) {
      response.body.cancel().catch(() => undefined);
      throw new NotionNetworkError(`Expected a text/event-stream response, got ${contentType}`);
    }

    for await (const frame of parseSseStream(
      this.readText(response.body, options.signal, options.idleTimeoutMs),
    )) {
      // One chunk can hold several frames. Stop at once when the caller aborts between them.
      this.throwIfAborted(options.signal);
      yield frame;
    }
  }

  /**
   * Run `send`, and retry it per {@link NotionAPIError.isRetryable}.
   * When `options.signal` aborts, stop at once, also during the wait between two attempts.
   */
  private async withRetries<T>(options: StreamRequestOptions, send: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      this.throwIfAborted(options.signal);

      try {
        return await send();
      } catch (error) {
        // canRetry() applies isRetryable(), retryOnRateLimit, retryOnServerError, and
        // retryOnGatewayTimeout. `status` is authoritative (see handleErrorResponse()).
        if (
          error instanceof NotionAPIError &&
          this.canRetry(error, options) &&
          attempt < this.maxRetries
        ) {
          // Prefer the server-supplied Retry-After value (header or body fallback);
          // fall back to exponential backoff when neither is present or valid.
          const retryAfter = error.retryAfterMs ?? this.getRetryAfter(attempt);
          await sleep(retryAfter, options.signal);
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
   * Return `true` when the request options allow a retry of `error`.
   */
  private canRetry(error: NotionAPIError, options: RequestOptions): boolean {
    if (!error.isRetryable()) {
      return false;
    }
    if (error.isRateLimited()) {
      return this.retryOnRateLimit;
    }
    // A 529 means that Notion shed the load and did not process the request.
    if (error.status === 529 || error.isServiceOverloaded()) {
      return true;
    }
    if (options.retryOnServerError === false) {
      return false;
    }
    return !(error.status === 504 && options.retryOnGatewayTimeout === false);
  }

  /**
   * Open one streaming connection. Return the response after a success status.
   */
  private async openStream(options: StreamRequestOptions): Promise<Response> {
    const url = this.buildUrl(options.path, options.query);

    try {
      const response = await this.fetchWithTimeout(
        url,
        {
          method: options.method,
          headers: { ...this.requestHeaders, Accept: 'text/event-stream' },
          body: options.body ? JSON.stringify(options.body) : undefined,
        },
        options.signal,
      );

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return response;
    } catch (error) {
      this.mapTransportError(error, options.signal);
    }
  }

  /**
   * Decode a response body into text chunks. Map a read failure to the matching SDK error.
   * Cancel the body when the caller stops early.
   */
  private async *readText(
    body: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
    idleTimeoutMs?: number,
  ): AsyncGenerator<string> {
    const reader = body.getReader();
    // Keep a byte order mark in the text. The SSE parser removes the one leading mark.
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
    let done = false;

    try {
      for (;;) {
        let result: Awaited<ReturnType<typeof reader.read>>;
        try {
          result = await readWithIdleTimeout(reader, idleTimeoutMs);
        } catch (error) {
          this.mapTransportError(error, signal);
        }

        if (result.done) {
          done = true;
          const rest = decoder.decode();
          if (rest !== '') {
            yield rest;
          }
          return;
        }

        yield decoder.decode(result.value, { stream: true });
      }
    } finally {
      if (!done) {
        // Do not await the cancel. A source can leave it pending, which would block the
        // caller's `break` or `return`.
        reader.cancel().catch(() => undefined);
      }
      reader.releaseLock();
    }
  }

  /**
   * Send a `multipart/form-data` `POST` to a Notion API path, and return the JSON response.
   * Do not set `Content-Type`, so `fetch` adds the multipart boundary. Retry the same way as
   * {@link request}, except on a `504 gateway_timeout` response.
   *
   * @param path - The API path, for example `/ai/skills/{id}/upload`
   * @param form - The multipart body
   * @throws {NotionAPIError} If the endpoint returns an error response.
   * @throws {NotionRequestTimeoutError} If the request exceeds the timeout.
   * @throws {NotionNetworkError} If a network problem blocks the request.
   */
  async requestMultipart<T>(path: string, form: FormData): Promise<T> {
    const options: RequestOptions = { method: 'POST', path, retryOnGatewayTimeout: false };

    return this.withRetries(options, async () => {
      const response = await this.postMultipart(this.buildUrl(path), form);
      try {
        return (await response.json()) as T;
      } catch (error) {
        this.mapTransportError(error);
      }
    });
  }

  /**
   * Send a `multipart/form-data` `POST` to a Notion file-upload URL. Reuses the
   * configured `fetch` and the request timeout. Does not retry. Does not set
   * `Content-Type`, so `fetch` adds the multipart boundary.
   *
   * @param uploadUrl - The absolute `upload_url` from `fileUploads.initiate()`.
   * @param form - A `FormData` body with the file bytes under the `file` key.
   * @throws {NotionValidationError} If `uploadUrl` is not a valid `https` URL.
   * @throws {NotionAPIError} If the endpoint returns an error response.
   * @throws {NotionRequestTimeoutError} If the request exceeds the timeout.
   * @throws {NotionNetworkError} If a network problem blocks the request.
   */
  async sendFileUpload(uploadUrl: string, form: FormData): Promise<void> {
    this.assertHttpsUrl(uploadUrl);
    await this.postMultipart(uploadUrl, form);
  }

  /**
   * Send a `multipart/form-data` `POST` to `url`, and return the success response. Do not set
   * `Content-Type`, so `fetch` adds the multipart boundary. Map a failure to an SDK error.
   */
  private async postMultipart(url: string, form: FormData): Promise<Response> {
    const { 'Content-Type': _contentType, ...headers } = this.requestHeaders;

    try {
      const response = await this.fetchWithTimeout(url, { method: 'POST', headers, body: form });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return response;
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
   * A caller `signal` also aborts the request, and stays active for the response body.
   */
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    signal?: AbortSignal,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(url, {
        ...init,
        signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Map a transport-layer failure to the matching SDK error and throw it.
   * Rethrow a `NotionAPIError` unchanged. Rethrow the abort reason when the caller's
   * `signal` aborted. Map any other `AbortError` to `NotionRequestTimeoutError`. Map any
   * other `Error` to `NotionNetworkError`.
   */
  private mapTransportError(error: unknown, signal?: AbortSignal): never {
    if (error instanceof NotionAPIError) {
      throw error;
    }

    if (signal?.aborted) {
      throw abortReason(signal);
    }

    if (error instanceof NotionNetworkError) {
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
   * Assert that `url` is a valid `https` URL. The SDK sends the API token in the
   * `Authorization` header of a file upload. Reject a plaintext `http` URL so the
   * token never travels unencrypted.
   */
  private assertHttpsUrl(url: string): void {
    let protocol: string;

    try {
      protocol = new URL(url).protocol;
    } catch {
      throw new NotionValidationError(`Invalid file upload URL: ${url}`);
    }

    if (protocol !== 'https:') {
      throw new NotionValidationError(`File upload URL must use https, got "${protocol}"`);
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
   * Throw the abort reason when `signal` already aborted.
   */
  private throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw abortReason(signal);
    }
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
   * Convert a whole-seconds string into milliseconds, clamped to
   * {@link MAX_RETRY_DELAY_MS}. `value` comes from an unvalidated header or
   * JSON body, so this accepts `unknown`. Return `undefined` if it is not a
   * non-blank string, or not a valid non-negative number.
   */
  private secondsToClampedMs(value: unknown): number | undefined {
    if (typeof value !== 'string' || value.trim() === '') {
      return undefined;
    }

    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 0) {
      return undefined;
    }

    return Math.min(Math.ceil(seconds) * 1000, MAX_RETRY_DELAY_MS);
  }

  /**
   * Parse the `Retry-After` response header into milliseconds, clamped to
   * {@link MAX_RETRY_DELAY_MS}. Return `undefined` if the header is missing,
   * blank, or not a valid non-negative number.
   */
  private parseRetryAfterHeader(response: Response): number | undefined {
    return this.secondsToClampedMs(response.headers.get('Retry-After'));
  }

  /**
   * Parse `additional_data.retry_after` from the error body into milliseconds,
   * clamped to {@link MAX_RETRY_DELAY_MS}. The Notion API repeats the
   * `Retry-After` value here for clients that cannot read response headers.
   * Return `undefined` if the field is missing, blank, or not a valid
   * non-negative number.
   */
  private parseRetryAfterBody(errorBody: NotionErrorResponse): number | undefined {
    return this.secondsToClampedMs(errorBody.additional_data?.retry_after);
  }

  /**
   * Check if `value` is a plain, non-null, non-array object. Use this to
   * guard a cast from unvalidated JSON before treating it as a record.
   */
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Build a generic error body for a response the SDK cannot parse into a
   * {@link NotionErrorResponse}.
   */
  private genericErrorBody(response: Response): NotionErrorResponse {
    return {
      object: 'error',
      status: response.status,
      code: 'internal_server_error',
      message: response.statusText || 'Unknown error occurred',
    };
  }

  /**
   * Handle an error response from the API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorBody: NotionErrorResponse;

    try {
      const parsed = await response.json();
      // A syntactically valid body can still be non-object JSON, such as `null`
      // or a bare string. Fall back to a generic error body in that case too;
      // otherwise assigning `status` below would throw.
      errorBody = this.isRecord(parsed)
        ? (parsed as unknown as NotionErrorResponse)
        : this.genericErrorBody(response);
    } catch {
      // If the SDK cannot parse the error body, create a generic error
      errorBody = this.genericErrorBody(response);
    }

    // The HTTP response status is authoritative. A proxy or a malformed body
    // can report a `status` field that disagrees with it, or omit it.
    errorBody.status = response.status;

    // Prefer the header. Use the body only when the header is missing or invalid.
    const retryAfterMs =
      this.parseRetryAfterHeader(response) ?? this.parseRetryAfterBody(errorBody);

    throw new NotionAPIError(errorBody, retryAfterMs);
  }
}
