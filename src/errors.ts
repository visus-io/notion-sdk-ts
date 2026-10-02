/**
 * Notion API error codes based on official documentation.
 *
 * @category Errors
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
  | 'service_overload'
  | 'database_connection_unavailable'
  | 'gateway_timeout';

/**
 * Reasons the Notion API gives for a `rate_limited` response.
 * Appears in `NotionErrorResponse.additional_data.rate_limit_reason`.
 *
 * @category Errors
 */
export const RATE_LIMIT_REASONS = [
  'public_api_request_rate_limit',
  'public_api_space_request_rate_limit',
  'public_api_endpoint_rate_limit',
  'mcp_tool_rate_limit',
  'collection_router_upstream_429',
  'public_api_request_blocked',
] as const;

/**
 * @category Errors
 */
export type RateLimitReason = (typeof RATE_LIMIT_REASONS)[number];

/**
 * Notion API error response structure.
 *
 * @category Errors
 */
export interface NotionErrorResponse {
  object: 'error';
  status: number;
  code: NotionErrorCode;
  message: string;

  /** Extra machine-readable context for some error codes, for example `restricted_resource`. */
  additional_data?: {
    /** Present on `rate_limited` responses. Duplicates `Retry-After` as whole seconds. */
    retry_after?: string;
    /** Present on `rate_limited` responses. Identifies which limit the request exceeded. */
    rate_limit_reason?: RateLimitReason;
  } & Record<string, unknown>;
}

/**
 * Thrown when the Notion API returns an error response.
 *
 * @category Errors
 */
export class NotionAPIError extends Error {
  readonly status: number;
  readonly code: NotionErrorCode;
  readonly body: NotionErrorResponse;
  readonly retryAfterMs?: number;
  readonly rateLimitReason?: RateLimitReason;

  constructor(response: NotionErrorResponse, retryAfterMs?: number) {
    super(response.message);
    this.name = 'NotionAPIError';
    this.status = response.status;
    this.code = response.code;
    this.body = response;
    this.retryAfterMs = retryAfterMs;
    this.rateLimitReason = response.additional_data?.rate_limit_reason;

    // Maintain proper stack trace for V8 engines
    if ('captureStackTrace' in Error) {
      (
        Error as typeof Error & {
          captureStackTrace: (obj: object, fn: new (...args: unknown[]) => unknown) => void;
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
   * Check if the error is a service overload error (HTTP 529).
   */
  isServiceOverloaded(): boolean {
    return this.code === 'service_overload';
  }

  /**
   * Check if the error is an authentication error.
   */
  isUnauthorized(): boolean {
    return this.code === 'unauthorized';
  }

  /**
   * Check if the API could not find the requested object.
   */
  isNotFound(): boolean {
    return this.code === 'object_not_found';
  }

  /**
   * Check if a workspace restriction blocked the request.
   * The Free workspace block limit is one example.
   */
  isRestrictedResource(): boolean {
    return this.code === 'restricted_resource';
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
   * A `rate_limited` error is not retryable when `rateLimitReason` is
   * `public_api_request_blocked`, since the request cannot succeed.
   */
  isRetryable(): boolean {
    if (this.rateLimitReason === 'public_api_request_blocked') {
      return false;
    }

    return this.isRateLimited() || this.isServerError();
  }
}

/**
 * Thrown when a request exceeds its timeout.
 *
 * @category Errors
 */
export class NotionRequestTimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'NotionRequestTimeoutError';

    if ('captureStackTrace' in Error) {
      (
        Error as typeof Error & {
          captureStackTrace: (obj: object, fn: new (...args: unknown[]) => unknown) => void;
        }
      ).captureStackTrace(this, NotionRequestTimeoutError);
    }
  }
}

/**
 * Thrown when a network problem, such as a DNS failure, blocks a request.
 *
 * @category Errors
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
          captureStackTrace: (obj: object, fn: new (...args: unknown[]) => unknown) => void;
        }
      ).captureStackTrace(this, NotionNetworkError);
    }
  }
}
