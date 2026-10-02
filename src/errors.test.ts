import { describe, it, expect } from 'vitest';
import {
  NotionAPIError,
  NotionRequestTimeoutError,
  NotionNetworkError,
  type NotionErrorResponse,
} from './errors';

describe('NotionAPIError', () => {
  const createErrorResponse = (
    code: NotionErrorResponse['code'],
    status: number,
  ): NotionErrorResponse => ({
    object: 'error',
    status,
    code,
    message: `Test error: ${code}`,
  });

  describe('constructor', () => {
    it('should create an error with correct properties', () => {
      const response = createErrorResponse('invalid_request', 400);
      const error = new NotionAPIError(response);

      expect(error.name).toBe('NotionAPIError');
      expect(error.message).toBe('Test error: invalid_request');
      expect(error.status).toBe(400);
      expect(error.code).toBe('invalid_request');
      expect(error.body).toEqual(response);
      expect(error.retryAfterMs).toBeUndefined();
    });

    it('should include retryAfterMs when provided', () => {
      const response = createErrorResponse('rate_limited', 429);
      const error = new NotionAPIError(response, 5000);

      expect(error.retryAfterMs).toBe(5000);
    });

    it('should expose rateLimitReason from additional_data when present', () => {
      const response: NotionErrorResponse = {
        ...createErrorResponse('rate_limited', 429),
        additional_data: { rate_limit_reason: 'public_api_endpoint_rate_limit', retry_after: '5' },
      };
      const error = new NotionAPIError(response);

      expect(error.rateLimitReason).toBe('public_api_endpoint_rate_limit');
    });

    it('should leave rateLimitReason undefined when additional_data is absent', () => {
      const response = createErrorResponse('rate_limited', 429);
      const error = new NotionAPIError(response);

      expect(error.rateLimitReason).toBeUndefined();
    });

    it('should be an instance of Error', () => {
      const response = createErrorResponse('internal_server_error', 500);
      const error = new NotionAPIError(response);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotionAPIError);
    });

    it('should have a stack trace', () => {
      const response = createErrorResponse('validation_error', 400);
      const error = new NotionAPIError(response);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotionAPIError');
    });
  });

  describe('isRateLimited', () => {
    it('should return true for rate_limited error', () => {
      const response = createErrorResponse('rate_limited', 429);
      const error = new NotionAPIError(response);

      expect(error.isRateLimited()).toBe(true);
    });

    it('should return false for non-rate-limited error', () => {
      const response = createErrorResponse('invalid_request', 400);
      const error = new NotionAPIError(response);

      expect(error.isRateLimited()).toBe(false);
    });

    it('should return false for a malformed body that claims code rate_limited at a non-429 status', () => {
      const response = createErrorResponse('rate_limited', 404);
      const error = new NotionAPIError(response);

      expect(error.isRateLimited()).toBe(false);
    });

    it('should return true for a real 429 even when a malformed body reports a different code', () => {
      const response = createErrorResponse('internal_server_error', 429);
      const error = new NotionAPIError(response);

      expect(error.isRateLimited()).toBe(true);
    });
  });

  describe('isUnauthorized', () => {
    it('should return true for unauthorized error', () => {
      const response = createErrorResponse('unauthorized', 401);
      const error = new NotionAPIError(response);

      expect(error.isUnauthorized()).toBe(true);
    });

    it('should return false for non-unauthorized error', () => {
      const response = createErrorResponse('invalid_request', 400);
      const error = new NotionAPIError(response);

      expect(error.isUnauthorized()).toBe(false);
    });
  });

  describe('isNotFound', () => {
    it('should return true for object_not_found error', () => {
      const response = createErrorResponse('object_not_found', 404);
      const error = new NotionAPIError(response);

      expect(error.isNotFound()).toBe(true);
    });

    it('should return false for non-not-found error', () => {
      const response = createErrorResponse('invalid_request', 400);
      const error = new NotionAPIError(response);

      expect(error.isNotFound()).toBe(false);
    });
  });

  describe('isRestrictedResource', () => {
    it('should return true for restricted_resource error', () => {
      const response = createErrorResponse('restricted_resource', 403);
      const error = new NotionAPIError(response);

      expect(error.isRestrictedResource()).toBe(true);
    });

    it('should return false for non-restricted-resource error', () => {
      const response = createErrorResponse('invalid_request', 400);
      const error = new NotionAPIError(response);

      expect(error.isRestrictedResource()).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for validation_error', () => {
      const response = createErrorResponse('validation_error', 400);
      const error = new NotionAPIError(response);

      expect(error.isValidationError()).toBe(true);
    });

    it('should return false for non-validation error', () => {
      const response = createErrorResponse('invalid_request', 400);
      const error = new NotionAPIError(response);

      expect(error.isValidationError()).toBe(false);
    });
  });

  describe('isServerError', () => {
    it.each([
      { status: 500, expected: true },
      { status: 503, expected: true },
      { status: 504, expected: true },
      { status: 599, expected: true },
      { status: 400, expected: false },
      { status: 404, expected: false },
      { status: 600, expected: false },
    ])('should return $expected for $status status', ({ status, expected }) => {
      const response = createErrorResponse('internal_server_error', status);
      const error = new NotionAPIError(response);

      expect(error.isServerError()).toBe(expected);
    });
  });

  describe('isRetryable', () => {
    it.each([
      { code: 'rate_limited', status: 429, expected: true },
      { code: 'internal_server_error', status: 500, expected: true },
      { code: 'service_unavailable', status: 503, expected: true },
      { code: 'invalid_request', status: 400, expected: false },
      { code: 'object_not_found', status: 404, expected: false },
      { code: 'restricted_resource', status: 403, expected: false },
    ] as const)('should return $expected for $code ($status)', ({ code, status, expected }) => {
      const response = createErrorResponse(code, status);
      const error = new NotionAPIError(response);

      expect(error.isRetryable()).toBe(expected);
    });

    it('should return false for rate_limited when rateLimitReason is public_api_request_blocked', () => {
      const response: NotionErrorResponse = {
        ...createErrorResponse('rate_limited', 429),
        additional_data: { rate_limit_reason: 'public_api_request_blocked' },
      };
      const error = new NotionAPIError(response);

      expect(error.isRetryable()).toBe(false);
    });

    it('should return true for rate_limited when rateLimitReason is a different reason', () => {
      const response: NotionErrorResponse = {
        ...createErrorResponse('rate_limited', 429),
        additional_data: { rate_limit_reason: 'public_api_endpoint_rate_limit' },
      };
      const error = new NotionAPIError(response);

      expect(error.isRetryable()).toBe(true);
    });

    it('should return true for a server error whose body carries a blocked rate_limit_reason', () => {
      // additional_data is not exclusive to rate_limited responses; a 5xx response
      // should stay retryable even if it happens to carry this field.
      const response: NotionErrorResponse = {
        ...createErrorResponse('internal_server_error', 500),
        additional_data: { rate_limit_reason: 'public_api_request_blocked' },
      };
      const error = new NotionAPIError(response);

      expect(error.isRetryable()).toBe(true);
    });

    it('should return true for a 500 whose malformed body falsely reports code rate_limited', () => {
      // Only the HTTP status (429), not the body-reported code, should gate the
      // blocked-reason exception. A real 500 must stay retryable regardless.
      const response: NotionErrorResponse = {
        object: 'error',
        status: 500,
        code: 'rate_limited',
        message: 'Malformed body',
        additional_data: { rate_limit_reason: 'public_api_request_blocked' },
      };
      const error = new NotionAPIError(response);

      expect(error.isRetryable()).toBe(true);
    });
  });
});

describe('NotionRequestTimeoutError', () => {
  describe('constructor', () => {
    it('should create an error with default message', () => {
      const error = new NotionRequestTimeoutError();

      expect(error.name).toBe('NotionRequestTimeoutError');
      expect(error.message).toBe('Request timed out');
    });

    it('should create an error with custom message', () => {
      const error = new NotionRequestTimeoutError('Custom timeout message');

      expect(error.name).toBe('NotionRequestTimeoutError');
      expect(error.message).toBe('Custom timeout message');
    });

    it('should be an instance of Error', () => {
      const error = new NotionRequestTimeoutError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotionRequestTimeoutError);
    });

    it('should have a stack trace', () => {
      const error = new NotionRequestTimeoutError();

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotionRequestTimeoutError');
    });
  });
});

describe('NotionNetworkError', () => {
  describe('constructor', () => {
    it('should create an error with message only', () => {
      const error = new NotionNetworkError('Network failure');

      expect(error.name).toBe('NotionNetworkError');
      expect(error.message).toBe('Network failure');
      expect(error.cause).toBeUndefined();
    });

    it('should create an error with message and cause', () => {
      const cause = new Error('DNS lookup failed');
      const error = new NotionNetworkError('Network failure', cause);

      expect(error.name).toBe('NotionNetworkError');
      expect(error.message).toBe('Network failure');
      expect(error.cause).toBe(cause);
    });

    it('should be an instance of Error', () => {
      const error = new NotionNetworkError('Network failure');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotionNetworkError);
    });

    it('should have a stack trace', () => {
      const error = new NotionNetworkError('Network failure');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotionNetworkError');
    });
  });
});
