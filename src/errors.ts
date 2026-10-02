/**
 * Notion API error codes based on official documentation.
 *
 * @category Errors
 */
export const NOTION_ERROR_CODES = [
  'invalid_json',
  'invalid_request_url',
  'invalid_request',
  'validation_error',
  'missing_version',
  'unauthorized',
  'restricted_resource',
  'object_not_found',
  'conflict_error',
  'rate_limited',
  'internal_server_error',
  'service_unavailable',
  'service_overload',
  'database_connection_unavailable',
  'gateway_timeout',
] as const;

/**
 * Notion may add new error codes over time. Treat an unrecognized code the
 * same as any other error response; read `status` to classify it.
 *
 * @category Errors
 */
export type NotionErrorCode = (typeof NOTION_ERROR_CODES)[number] | (string & Record<never, never>);

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
 * Notion may add new reason strings over time. Treat an unrecognized value the
 * same as any other `rate_limited` response.
 *
 * @category Errors
 */
export type RateLimitReason = (typeof RATE_LIMIT_REASONS)[number] | (string & Record<never, never>);

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
    /** Present on `rate_limited` responses. Identifies why the API rate-limited the request. */
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
    this.body = response;
    this.retryAfterMs = retryAfterMs;

    // response comes from an unvalidated JSON body cast to NotionErrorResponse, so
    // `code` could be any JSON type at runtime despite its string type. Check the
    // runtime type before exposing it. Fall back to a generic code; `status` stays
    // the authoritative field for classifying the error.
    const rawCode: unknown = response.code;
    this.code = typeof rawCode === 'string' ? rawCode : 'internal_server_error';

    // additional_data comes from the same unvalidated body, so rate_limit_reason
    // could likewise be any JSON type at runtime despite its string type. Check
    // the runtime type before exposing it on this public property.
    const rawRateLimitReason: unknown = response.additional_data?.rate_limit_reason;
    this.rateLimitReason = typeof rawRateLimitReason === 'string' ? rawRateLimitReason : undefined;

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
   * Check if the error is a rate limit error (HTTP 429).
   * Check `status`, not `code`. A malformed body could report the wrong
   * `code` for a real 429, or report `rate_limited` for a real non-429
   * status. `status` always matches the real HTTP response. See
   * `NotionClient.handleErrorResponse()`.
   */
  isRateLimited(): boolean {
    return this.status === 429;
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
   * A `429` is not retryable when `rateLimitReason` is `public_api_request_blocked`,
   * since the request cannot succeed.
   */
  isRetryable(): boolean {
    if (this.isRateLimited() && this.rateLimitReason === 'public_api_request_blocked') {
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
