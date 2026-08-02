import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { View } from '../models';
import { Notion } from '../notion';
import { buildErrorBody, buildPageResponse } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('ViewsAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  const viewId = '123e4567-e89b-12d3-a456-426614174000';
  const databaseId = '223e4567-e89b-12d3-a456-426614174000';
  const dataSourceId = '323e4567-e89b-12d3-a456-426614174001';
  const baseUser = { object: 'user' as const, id: '423e4567-e89b-12d3-a456-426614174002' };

  function buildViewResponse(overrides: Record<string, unknown> = {}) {
    return {
      object: 'view',
      id: viewId,
      parent: { type: 'database_id', database_id: databaseId },
      data_source_id: dataSourceId,
      name: 'All items',
      type: 'table',
      created_time: '2026-01-01T00:00:00.000Z',
      last_edited_time: '2026-01-02T00:00:00.000Z',
      created_by: baseUser,
      last_edited_by: baseUser,
      url: `https://notion.so/${viewId}`,
      ...overrides,
    };
  }

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('list', () => {
    it('should list views by database_id', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/views`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('database_id')).toBe(databaseId);
          return HttpResponse.json({
            object: 'list',
            results: [buildViewResponse()],
            next_cursor: null,
            has_more: false,
            type: 'view',
          });
        }),
      );

      const result = await notion.views.list({ database_id: databaseId });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(View);
    });

    it('should list views by data_source_id', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/views`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('data_source_id')).toBe(dataSourceId);
          return HttpResponse.json({
            object: 'list',
            results: [buildViewResponse()],
            next_cursor: null,
            has_more: false,
            type: 'view',
          });
        }),
      );

      const result = await notion.views.list({ data_source_id: dataSourceId });

      expect(result.results).toHaveLength(1);
    });
  });

  describe('retrieve', () => {
    it('should retrieve a view over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/views/${viewId}`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json(buildViewResponse());
        }),
      );

      const result = await notion.views.retrieve(viewId);

      expect(result).toBeInstanceOf(View);
      expect(result.id).toBe(viewId);
    });
  });

  describe('create', () => {
    it('should create a view under an existing database', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/views`, async ({ request }) => {
          const body = (await request.json()) as { database_id?: string };
          expect(body.database_id).toBe(databaseId);
          return HttpResponse.json(buildViewResponse());
        }),
      );

      const result = await notion.views.create({
        data_source_id: dataSourceId,
        name: 'All items',
        type: 'table',
        database_id: databaseId,
      });

      expect(result).toBeInstanceOf(View);
    });
  });

  describe('update', () => {
    it('should update a view and support clearing filter with null', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/views/${viewId}`, async ({ request }) => {
          const body = (await request.json()) as { filter?: unknown };
          expect(body.filter).toBeNull();
          return HttpResponse.json(buildViewResponse({ filter: null }));
        }),
      );

      const result = await notion.views.update(viewId, { filter: null });

      expect(result).toBeInstanceOf(View);
      expect(result.filter).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a view and return the partial response', async () => {
      server.use(
        http.delete(`${NOTION_TEST_BASE_URL}/v1/views/${viewId}`, () =>
          HttpResponse.json({
            object: 'view',
            id: viewId,
            parent: { type: 'database_id', database_id: databaseId },
            type: 'table',
          }),
        ),
      );

      const result = await notion.views.delete(viewId);

      expect(result).toEqual({
        object: 'view',
        id: viewId,
        parent: { type: 'database_id', database_id: databaseId },
        type: 'table',
      });
    });
  });

  describe('queries', () => {
    const queryId = '523e4567-e89b-12d3-a456-426614174003';

    it('should create a query and return results with pagination metadata', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/views/${viewId}/queries`, () =>
          HttpResponse.json({
            object: 'view_query',
            id: queryId,
            view_id: viewId,
            expires_at: '2026-01-01T00:15:00.000Z',
            total_count: 1,
            results: [buildPageResponse()],
            next_cursor: null,
            has_more: false,
          }),
        ),
      );

      const result = await notion.views.queries.create(viewId, { page_size: 10 });

      expect(result.id).toBe(queryId);
      expect(result.viewId).toBe(viewId);
      expect(result.totalCount).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.expiresAt).toEqual(new Date('2026-01-01T00:15:00.000Z'));
    });

    it('should propagate request_status when a query is capped at the result limit', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/views/${viewId}/queries`, () =>
          HttpResponse.json({
            object: 'view_query',
            id: queryId,
            view_id: viewId,
            expires_at: '2026-01-01T00:15:00.000Z',
            total_count: 10_000,
            results: [buildPageResponse()],
            next_cursor: null,
            has_more: false,
            request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
          }),
        ),
      );

      const result = await notion.views.queries.create(viewId);

      expect(result.requestStatus).toEqual({
        type: 'incomplete',
        incomplete_reason: 'query_result_limit_reached',
      });
    });

    it('should get an existing query result', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/views/${viewId}/queries/${queryId}`, () =>
          HttpResponse.json({
            object: 'view_query',
            id: queryId,
            view_id: viewId,
            expires_at: '2026-01-01T00:15:00.000Z',
            total_count: 0,
            results: [],
            next_cursor: null,
            has_more: false,
          }),
        ),
      );

      const result = await notion.views.queries.get(viewId, queryId);

      expect(result.id).toBe(queryId);
      expect(result.results).toHaveLength(0);
    });

    it('should delete a query', async () => {
      server.use(
        http.delete(`${NOTION_TEST_BASE_URL}/v1/views/${viewId}/queries/${queryId}`, () =>
          HttpResponse.json({}),
        ),
      );

      await expect(notion.views.queries.delete(viewId, queryId)).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isNotFound() on a 404 response', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/views/unknown-id`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'View not found'), {
            status: 404,
          }),
        ),
      );

      try {
        await notion.views.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
