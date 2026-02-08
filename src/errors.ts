/**
 * Notion API error codes based on official documentation.
 */
export type NotionErrorCode =
  | 'invalid_json'
  | 'invalid_request_url'
  | 'invalid_request'
  | 'validation_error'
  | 'missing_version'
  | 'unauthorized'
  | 'restricted_resource'
  | 'object_not_found'
  | 'conflict_error'
  | 'rate_limited'
  | 'internal_server_error'
  | 'service_unavailable'
  | 'database_connection_unavailable'
  | 'gateway_timeout';

/**
 * Notion API error response structure.
 */
export interface NotionErrorResponse {
  object: 'error';
  status: number;
  code: NotionErrorCode;
  message: string;
}

/**
 * Custom error class for Notion API errors.
 */
export class NotionAPIError extends Error {
  readonly status: number;
  readonly code: NotionErrorCode;
  readonly body: NotionErrorResponse;
  readonly retryAfterMs?: number;

  constructor(response: NotionErrorResponse, retryAfterMs?: number) {
    super(response.message);
    this.name = 'NotionAPIError';
    this.status = response.status;
    this.code = response.code;
    this.body = response;
    this.retryAfterMs = retryAfterMs;

    // Maintain proper stack trace for V8 engines
    if ('captureStackTrace' in Error) {
      (
        Error as typeof Error & {
          captureStackTrace: (obj: object, fn: (...args: unknown[]) => unknown) => void;
        }
      ).captureStackTrace(this, NotionAPIError);
    }
  }

  /**
   * Check if the error is a rate limit error.
   */
  isRateLimited(): boolean {
    return this.code === 'rate_limited';
  }

  /**
   * Check if the error is an authentication error.
   */
  isUnauthorized(): boolean {
    return this.code === 'unauthorized';
  }

  /**
   * Check if the error is a not found error.
   */
  isNotFound(): boolean {
    return this.code === 'object_not_found';
  }

  /**
   * Check if the error is a validation error.
   */
  isValidationError(): boolean {
    return this.code === 'validation_error';
  }

  /**
   * Check if the error is a server error (5xx).
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if the error is retryable (rate limit or server error).
   */
  isRetryable(): boolean {
    return this.isRateLimited() || this.isServerError();
  }
}

/**
 * Request timeout error.
 */
export class NotionRequestTimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'NotionRequestTimeoutError';

    if ('captureStackTrace' in Error) {
      (
        Error as typeof Error & {
          captureStackTrace: (obj: object, fn: (...args: unknown[]) => unknown) => void;
        }
      ).captureStackTrace(this, NotionRequestTimeoutError);
    }
  }
}

/**
 * Network error (connectivity issues, DNS failure, etc.).
 */
export class NotionNetworkError extends Error {
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'NotionNetworkError';
    this.cause = cause;

    if ('captureStackTrace' in Error) {
      (
        Error as typeof Error & {
          captureStackTrace: (obj: object, fn: (...args: unknown[]) => unknown) => void;
        }
      ).captureStackTrace(this, NotionNetworkError);
    }
  }
}
