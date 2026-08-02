import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { DataSource, Page } from '../models';
import { Notion } from '../notion';
import { buildDataSourceResponse, buildErrorBody, buildPageResponse } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('SearchAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('query', () => {
    it('should return mixed page and data source results mapped to the correct model classes', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/search`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json({
            object: 'list',
            results: [buildPageResponse(), buildDataSourceResponse()],
            next_cursor: null,
            has_more: false,
            type: 'page_or_data_source',
          });
        }),
      );

      const result = await notion.search.query({ query: 'notes' });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toBeInstanceOf(Page);
      expect(result.results[1]).toBeInstanceOf(DataSource);
    });

    it('should send the filter in the request body', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/search`, async ({ request }) => {
          const body = (await request.json()) as { filter: unknown };
          expect(body.filter).toEqual({ value: 'data_source', property: 'object' });
          return HttpResponse.json({
            object: 'list',
            results: [],
            next_cursor: null,
            has_more: false,
            type: 'page_or_data_source',
          });
        }),
      );

      await notion.search.query({ filter: { value: 'data_source', property: 'object' } });
    });

    it('should send a standalone in_trash filter in the request body', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/search`, async ({ request }) => {
          const body = (await request.json()) as { filter: unknown };
          expect(body.filter).toEqual({ in_trash: true });
          return HttpResponse.json({
            object: 'list',
            results: [],
            next_cursor: null,
            has_more: false,
            type: 'page_or_data_source',
          });
        }),
      );

      await notion.search.query({ filter: { in_trash: true } });
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should surface a rate-limited NotionAPIError through the facade', async () => {
      const rateLimitedNotion = new Notion({
        auth: NOTION_TEST_AUTH_TOKEN,
        baseUrl: NOTION_TEST_BASE_URL,
        retryOnRateLimit: false,
      });

      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/search`, () =>
          HttpResponse.json(buildErrorBody(429, 'rate_limited', 'Rate limited'), { status: 429 }),
        ),
      );

      try {
        await rateLimitedNotion.search.query({ query: 'notes' });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isRateLimited()).toBe(true);
      }
    });
  });
});
