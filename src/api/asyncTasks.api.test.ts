import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncTasksAPI } from './asyncTasks.api';
import type { NotionClient } from '../client';
import { NotionAPIError, NotionRequestTimeoutError } from '../errors';
import { AsyncTask } from '../models';

describe('AsyncTasksAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const asyncTasksAPI = new AsyncTasksAPI(mockClient);

  const baseTask = {
    object: 'async_task' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
    status_url: 'https://api.notion.com/v1/async_tasks/123e4567-e89b-12d3-a456-426614174000',
    created_time: '2026-01-01T00:00:00.000Z',
    operation: { surface: 'rest' as const, name: 'update_page_markdown' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retrieve', () => {
    it('should retrieve an async task', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({ ...baseTask, status: 'queued' });

      const result = await asyncTasksAPI.retrieve(baseTask.id);

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: `/async_tasks/${baseTask.id}`,
        query: undefined,
      });
      expect(result).toBeInstanceOf(AsyncTask);
      expect(result.status).toBe('queued');
    });

    it('should propagate a 404 as NotionAPIError', async () => {
      vi.mocked(mockClient.request).mockRejectedValue(
        new NotionAPIError({
          object: 'error',
          status: 404,
          code: 'object_not_found',
          message: 'Task not found',
        }),
      );

      try {
        await asyncTasksAPI.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });

  describe('poll', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should wait poll_after_seconds between polls until the task is terminal', async () => {
      vi.mocked(mockClient.request)
        .mockResolvedValueOnce({ ...baseTask, status: 'queued', poll_after_seconds: 2 })
        .mockResolvedValueOnce({ ...baseTask, status: 'succeeded' });

      const promise = asyncTasksAPI.poll(baseTask.id);

      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result.status).toBe('succeeded');
      expect(mockClient.request).toHaveBeenCalledTimes(2);
    });

    it('should throw NotionRequestTimeoutError when the timeout is exceeded', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({
        ...baseTask,
        status: 'running',
        poll_after_seconds: 100,
      });

      let caughtError: unknown;
      const promise = asyncTasksAPI
        .poll(baseTask.id, { timeoutMs: 150 })
        .catch((error: unknown) => {
          caughtError = error;
        });

      await vi.advanceTimersByTimeAsync(100_000);

      await promise;

      expect(caughtError).toBeInstanceOf(NotionRequestTimeoutError);
    });
  });
});
