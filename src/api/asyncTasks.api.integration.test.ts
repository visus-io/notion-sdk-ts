import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { AsyncTask } from '../models';
import { Notion } from '../notion';
import { buildErrorBody } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('AsyncTasksAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  const taskId = '123e4567-e89b-12d3-a456-426614174000';
  const baseTask = {
    object: 'async_task' as const,
    id: taskId,
    status_url: `${NOTION_TEST_BASE_URL}/v1/async_tasks/${taskId}`,
    created_time: '2026-01-01T00:00:00.000Z',
    operation: { surface: 'rest' as const, name: 'update_page_markdown' },
  };

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a queued task over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/async_tasks/${taskId}`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json({ ...baseTask, status: 'queued', poll_after_seconds: 2 });
        }),
      );

      const result = await notion.asyncTasks.retrieve(taskId);

      expect(result).toBeInstanceOf(AsyncTask);
      expect(result.status).toBe('queued');
      expect(result.pollAfterSeconds).toBe(2);
    });

    it('should retrieve a succeeded task with its result', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/async_tasks/${taskId}`, () =>
          HttpResponse.json({
            ...baseTask,
            status: 'succeeded',
            result: { object: 'page_markdown', id: '223e4567-e89b-12d3-a456-426614174000' },
          }),
        ),
      );

      const result = await notion.asyncTasks.retrieve(taskId);

      expect(result.isSucceeded()).toBe(true);
      expect(result.result).toEqual({
        object: 'page_markdown',
        id: '223e4567-e89b-12d3-a456-426614174000',
      });
    });

    it('should retrieve a failed task with its error', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/async_tasks/${taskId}`, () =>
          HttpResponse.json({
            ...baseTask,
            status: 'failed',
            error: {
              object: 'error',
              status: 400,
              code: 'validation_error',
              message: 'old_str not found',
            },
          }),
        ),
      );

      const result = await notion.asyncTasks.retrieve(taskId);

      expect(result.isFailed()).toBe(true);
      expect(result.error?.message).toBe('old_str not found');
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isNotFound() on a 404 response', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/async_tasks/unknown-id`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Task not found'), {
            status: 404,
          }),
        ),
      );

      try {
        await notion.asyncTasks.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
