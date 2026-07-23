import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { DataSource, Page } from '../models';
import { Notion } from '../notion';
import { buildDataSourceResponse, buildErrorBody, buildPageResponse } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('DataSourcesAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });
  const dataSourceId = '123e4567-e89b-12d3-a456-426614174000';

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a data source over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/data_sources/${dataSourceId}`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json(buildDataSourceResponse({ id: dataSourceId }));
        }),
      );

      const result = await notion.dataSources.retrieve(dataSourceId);

      expect(result).toBeInstanceOf(DataSource);
      expect(result.id).toBe(dataSourceId);
    });
  });

  describe('query', () => {
    it('should query a data source and return a paginated list of pages', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/data_sources/${dataSourceId}/query`, () =>
          HttpResponse.json({
            object: 'list',
            results: [buildPageResponse()],
            next_cursor: null,
            has_more: false,
            type: 'page',
          }),
        ),
      );

      const result = await notion.dataSources.query(dataSourceId, {
        filter: { property: 'Name', title: { is_not_empty: true } },
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Page);
    });

    it('should send filter_properties as repeated query string parameters, not in the body', async () => {
      server.use(
        http.post(
          `${NOTION_TEST_BASE_URL}/v1/data_sources/${dataSourceId}/query`,
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

      await notion.dataSources.query(dataSourceId, { filter_properties: ['Name', 'Status'] });
    });

    it('should send is_archived in the request body to include archived pages', async () => {
      server.use(
        http.post(
          `${NOTION_TEST_BASE_URL}/v1/data_sources/${dataSourceId}/query`,
          async ({ request }) => {
            const body = (await request.json()) as { is_archived?: boolean };
            expect(body.is_archived).toBe(true);

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

      await notion.dataSources.query(dataSourceId, { is_archived: true });
    });
  });

  describe('create', () => {
    it('should create a data source under a database', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/data_sources`, () =>
          HttpResponse.json(buildDataSourceResponse()),
        ),
      );

      const result = await notion.dataSources.create({
        parent: { database_id: 'parent-database-id' },
        properties: { Name: { title: {} } },
      });

      expect(result).toBeInstanceOf(DataSource);
    });
  });

  describe('update', () => {
    it('should update a data source title', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/data_sources/${dataSourceId}`, () =>
          HttpResponse.json(buildDataSourceResponse({ id: dataSourceId })),
        ),
      );

      const result = await notion.dataSources.update(dataSourceId, {
        title: [{ type: 'text', text: { content: 'Renamed' } }],
      });

      expect(result).toBeInstanceOf(DataSource);
    });
  });

  describe('trash / untrash', () => {
    it('should move a data source to trash and back', async () => {
      server.use(
        http.patch(
          `${NOTION_TEST_BASE_URL}/v1/data_sources/${dataSourceId}`,
          async ({ request }) => {
            const body = (await request.json()) as { in_trash: boolean };
            return HttpResponse.json(
              buildDataSourceResponse({ id: dataSourceId, in_trash: body.in_trash }),
            );
          },
        ),
      );

      const trashed = await notion.dataSources.trash(dataSourceId);
      expect(trashed.inTrash).toBe(true);

      const untrashed = await notion.dataSources.untrash(dataSourceId);
      expect(untrashed.inTrash).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isNotFound() on a 404 response', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/data_sources/unknown-id`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Data source not found'), {
            status: 404,
          }),
        ),
      );

      try {
        await notion.dataSources.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
