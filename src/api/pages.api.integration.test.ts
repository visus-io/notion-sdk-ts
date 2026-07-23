import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { Page } from '../models';
import { Notion } from '../notion';
import { buildErrorBody, buildPageResponse } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('PagesAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });
  const pageId = '123e4567-e89b-12d3-a456-426614174000';

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a page over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/pages/${pageId}`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json(buildPageResponse({ id: pageId }));
        }),
      );

      const result = await notion.pages.retrieve(pageId);

      expect(result).toBeInstanceOf(Page);
      expect(result.id).toBe(pageId);
      expect(result.getTitle()).toBe('Test Page');
    });
  });

  describe('create', () => {
    it('should create a page with a page parent', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/pages`, async ({ request }) => {
          const body = (await request.json()) as { parent: unknown };
          expect(body.parent).toEqual({ page_id: 'parent-page-id' });
          return HttpResponse.json(buildPageResponse());
        }),
      );

      const result = await notion.pages.create({
        parent: { page_id: 'parent-page-id' },
        properties: {
          title: { title: [{ type: 'text', text: { content: 'New Page' } }] },
        },
      });

      expect(result).toBeInstanceOf(Page);
    });
  });

  describe('update', () => {
    it('should update page properties', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/pages/${pageId}`, () =>
          HttpResponse.json(buildPageResponse({ id: pageId })),
        ),
      );

      const result = await notion.pages.update(pageId, {
        properties: { Status: { select: { name: 'In Progress' } } },
      });

      expect(result).toBeInstanceOf(Page);
      expect(result.id).toBe(pageId);
    });
  });

  describe('trash / restore', () => {
    it('should move a page to trash and back', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/pages/${pageId}`, async ({ request }) => {
          const body = (await request.json()) as { in_trash: boolean };
          return HttpResponse.json(buildPageResponse({ id: pageId, in_trash: body.in_trash }));
        }),
      );

      const trashed = await notion.pages.trash(pageId);
      expect(trashed.inTrash).toBe(true);

      const restored = await notion.pages.restore(pageId);
      expect(restored.inTrash).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isNotFound() on a 404 response', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/pages/unknown-id`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Page not found'), {
            status: 404,
          }),
        ),
      );

      try {
        await notion.pages.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
