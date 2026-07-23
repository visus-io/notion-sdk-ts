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
    ] as const)('should return $expected for $code ($status)', ({ code, status, expected }) => {
      const response = createErrorResponse(code, status);
      const error = new NotionAPIError(response);

      expect(error.isRetryable()).toBe(expected);
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
