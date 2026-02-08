import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotionClient } from './client';
import { NotionAPIError } from './errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal mock Response. */
function mockResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 429 ? 'Too Many Requests' : 'OK',
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

/** Rate-limited error body the Notion API returns. */
const rateLimitedBody = {
  object: 'error' as const,
  status: 429,
  code: 'rate_limited' as const,
  message: 'Rate limited',
};

/** A successful JSON body. */
const successBody = { object: 'page', id: 'page-id' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotionClient', () => {
  describe('Retry-After header parsing', () => {
    it('should store retryAfterMs on NotionAPIError when Retry-After header is present', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(mockResponse(429, rateLimitedBody, { 'Retry-After': '5' }));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        retryOnRateLimit: false,
      });

      try {
        await client.request({ method: 'GET', path: '/pages/abc' });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        const apiError = error as NotionAPIError;
        expect(apiError.retryAfterMs).toBe(5000);
      }
    });

    it('should set retryAfterMs to undefined when Retry-After header is absent', async () => {
      const fetchMock = vi.fn().mockResolvedValue(mockResponse(429, rateLimitedBody));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        retryOnRateLimit: false,
      });

      try {
        await client.request({ method: 'GET', path: '/pages/abc' });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        const apiError = error as NotionAPIError;
        expect(apiError.retryAfterMs).toBeUndefined();
      }
    });

    it('should set retryAfterMs to undefined for invalid Retry-After values', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(mockResponse(429, rateLimitedBody, { 'Retry-After': 'not-a-number' }));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        retryOnRateLimit: false,
      });

      try {
        await client.request({ method: 'GET', path: '/pages/abc' });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).retryAfterMs).toBeUndefined();
      }
    });

    it('should set retryAfterMs to undefined for negative Retry-After values', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(mockResponse(429, rateLimitedBody, { 'Retry-After': '-1' }));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        retryOnRateLimit: false,
      });

      try {
        await client.request({ method: 'GET', path: '/pages/abc' });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).retryAfterMs).toBeUndefined();
      }
    });

    it('should ceil fractional Retry-After values', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(mockResponse(429, rateLimitedBody, { 'Retry-After': '1.5' }));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        retryOnRateLimit: false,
      });

      try {
        await client.request({ method: 'GET', path: '/pages/abc' });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).retryAfterMs).toBe(2000);
      }
    });
  });

  describe('retry logic with Retry-After', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should use Retry-After header delay when present', async () => {
      const fetchMock = vi
        .fn()
        // First call: rate limited with Retry-After: 3
        .mockResolvedValueOnce(mockResponse(429, rateLimitedBody, { 'Retry-After': '3' }))
        // Second call: success
        .mockResolvedValueOnce(mockResponse(200, successBody));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        maxRetries: 1,
      });

      const promise = client.request({ method: 'GET', path: '/pages/abc' });

      // Advance past the Retry-After delay (3000ms)
      await vi.advanceTimersByTimeAsync(3000);

      const result = await promise;

      expect(result).toEqual(successBody);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should fall back to exponential backoff when Retry-After is absent', async () => {
      const fetchMock = vi
        .fn()
        // First call: rate limited, no Retry-After header
        .mockResolvedValueOnce(mockResponse(429, rateLimitedBody))
        // Second call: success
        .mockResolvedValueOnce(mockResponse(200, successBody));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        maxRetries: 1,
      });

      const promise = client.request({ method: 'GET', path: '/pages/abc' });

      // Exponential backoff attempt 0: 2^0 * 1000 = 1000ms
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(result).toEqual(successBody);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should throw after exhausting all retries', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(mockResponse(429, rateLimitedBody, { 'Retry-After': '1' }));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        maxRetries: 2,
      });

      // Attach the catch handler immediately to avoid unhandled rejection
      let caughtError: unknown;
      const promise = client
        .request({ method: 'GET', path: '/pages/abc' })
        .catch((error: unknown) => {
          caughtError = error;
        });

      // Advance through both retry delays
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      await promise;

      expect(caughtError).toBeInstanceOf(NotionAPIError);
      expect((caughtError as NotionAPIError).isRateLimited()).toBe(true);

      // Initial attempt + 2 retries = 3 total calls
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should not retry when retryOnRateLimit is disabled', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(mockResponse(429, rateLimitedBody, { 'Retry-After': '1' }));

      const client = new NotionClient({
        auth: 'test-token',
        fetch: fetchMock,
        retryOnRateLimit: false,
      });

      try {
        await client.request({ method: 'GET', path: '/pages/abc' });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
      }

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
