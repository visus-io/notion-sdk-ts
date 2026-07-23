import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { Database, Page } from '../models';
import { Notion } from '../notion';
import { buildDatabaseResponse, buildErrorBody, buildPageResponse } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('DatabasesAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });
  const databaseId = '123e4567-e89b-12d3-a456-426614174000';

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a database over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/databases/${databaseId}`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json(buildDatabaseResponse({ id: databaseId }));
        }),
      );

      const result = await notion.databases.retrieve(databaseId);

      expect(result).toBeInstanceOf(Database);
      expect(result.id).toBe(databaseId);
    });
  });

  describe('query', () => {
    it('should query a database and return a paginated list of pages', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/databases/${databaseId}/query`, () =>
          HttpResponse.json({
            object: 'list',
            results: [buildPageResponse()],
            next_cursor: null,
            has_more: false,
            type: 'page',
          }),
        ),
      );

      const result = await notion.databases.query(databaseId, {
        filter: { property: 'Name', title: { is_not_empty: true } },
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Page);
    });

    it('should send filter_properties as repeated query string parameters, not in the body', async () => {
      server.use(
        http.post(
          `${NOTION_TEST_BASE_URL}/v1/databases/${databaseId}/query`,
          async ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.getAll('filter_properties')).toEqual(['Name', 'Status']);

            const rawBody = await request.text();
            expect(rawBody).toBe('');

            return HttpResponse.json({
              object: 'list',
              results: [],
              next_cursor: null,
              has_more: false,
              type: 'page',
            });
          },
        ),
      );

      await notion.databases.query(databaseId, { filter_properties: ['Name', 'Status'] });
    });
  });

  describe('create', () => {
    it('should create a database with an initial data source', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/databases`, () =>
          HttpResponse.json(buildDatabaseResponse()),
        ),
      );

      const result = await notion.databases.create({
        parent: { page_id: 'parent-page-id' },
        initial_data_source: { properties: { Name: { title: {} } } },
      });

      expect(result).toBeInstanceOf(Database);
    });
  });

  describe('update', () => {
    it('should update a database title', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/databases/${databaseId}`, () =>
          HttpResponse.json(buildDatabaseResponse({ id: databaseId })),
        ),
      );

      const result = await notion.databases.update(databaseId, {
        title: [{ type: 'text', text: { content: 'Renamed' } }],
      });

      expect(result).toBeInstanceOf(Database);
    });
  });

  describe('trash / restore', () => {
    it('should move a database to trash and back', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/databases/${databaseId}`, async ({ request }) => {
          const body = (await request.json()) as { in_trash: boolean };
          return HttpResponse.json(
            buildDatabaseResponse({ id: databaseId, in_trash: body.in_trash }),
          );
        }),
      );

      const trashed = await notion.databases.trash(databaseId);
      expect(trashed.inTrash).toBe(true);

      const restored = await notion.databases.restore(databaseId);
      expect(restored.inTrash).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isNotFound() when querying an unknown database', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/databases/unknown-id/query`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Database not found'), {
            status: 404,
          }),
        ),
      );

      try {
        await notion.databases.query('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
