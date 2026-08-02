import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { Block } from '../models';
import { Notion } from '../notion';
import { buildBlockResponse, buildErrorBody } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('BlocksAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });
  const blockId = '123e4567-e89b-12d3-a456-426614174000';

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a block over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/blocks/${blockId}`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json(buildBlockResponse({ id: blockId }));
        }),
      );

      const result = await notion.blocks.retrieve(blockId);

      expect(result).toBeInstanceOf(Block);
      expect(result.id).toBe(blockId);
    });
  });

  describe('update', () => {
    it('should update a block', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/blocks/${blockId}`, () =>
          HttpResponse.json(buildBlockResponse({ id: blockId })),
        ),
      );

      const result = await notion.blocks.update(blockId, {
        paragraph: { rich_text: [] },
      });

      expect(result).toBeInstanceOf(Block);
    });
  });

  describe('delete', () => {
    it('should archive a block', async () => {
      server.use(
        http.delete(`${NOTION_TEST_BASE_URL}/v1/blocks/${blockId}`, () =>
          HttpResponse.json(buildBlockResponse({ id: blockId, in_trash: true })),
        ),
      );

      const result = await notion.blocks.delete(blockId);

      expect(result).toBeInstanceOf(Block);
      expect(result.inTrash).toBe(true);
    });
  });

  describe('children.list', () => {
    it('should list a paginated list of children blocks', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/blocks/${blockId}/children`, () =>
          HttpResponse.json({
            object: 'list',
            results: [buildBlockResponse()],
            next_cursor: null,
            has_more: false,
            type: 'block',
          }),
        ),
      );

      const result = await notion.blocks.children.list(blockId);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Block);
      expect(result.has_more).toBe(false);
    });
  });

  describe('children.append', () => {
    it('should append children blocks to a parent block', async () => {
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/blocks/${blockId}/children`, () =>
          HttpResponse.json({
            object: 'list',
            results: [buildBlockResponse()],
            next_cursor: null,
            has_more: false,
            type: 'block',
          }),
        ),
      );

      const result = await notion.blocks.children.append(blockId, {
        children: [
          {
            type: 'paragraph',
            paragraph: { rich_text: [{ type: 'text', text: { content: 'Hi' } }] },
          },
        ],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Block);
    });
  });

  describe('meetingNotes.query', () => {
    it('should query meeting notes with filter, sort, and limit', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/blocks/meeting_notes/query`, async ({ request }) => {
          const body = (await request.json()) as {
            filter?: unknown;
            sort?: unknown;
            limit?: number;
          };
          expect(body.filter).toEqual({
            operator: 'and',
            filters: [{ property: 'title', filter: { operator: 'contains', value: 'sync' } }],
          });
          expect(body.sort).toEqual([{ property: 'created_time', direction: 'descending' }]);
          expect(body.limit).toBe(10);

          return HttpResponse.json({
            results: [
              buildBlockResponse({
                type: 'meeting_notes',
                meeting_notes: {
                  title: [],
                  status: 'in_progress',
                  children: {},
                },
              }),
            ],
            has_more: false,
          });
        }),
      );

      const result = await notion.blocks.meetingNotes.query({
        filter: {
          operator: 'and',
          filters: [{ property: 'title', filter: { operator: 'contains', value: 'sync' } }],
        },
        sort: [{ property: 'created_time', direction: 'descending' }],
        limit: 10,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Block);
      expect(result.hasMore).toBe(false);
    });

    it('should return an empty result set when there are no matches', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/blocks/meeting_notes/query`, () =>
          HttpResponse.json({ results: [], has_more: false }),
        ),
      );

      const result = await notion.blocks.meetingNotes.query();

      expect(result.results).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it('should propagate request_status when capped at the result limit', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/blocks/meeting_notes/query`, () =>
          HttpResponse.json({
            results: [],
            has_more: false,
            request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
          }),
        ),
      );

      const result = await notion.blocks.meetingNotes.query();

      expect(result.requestStatus).toEqual({
        type: 'incomplete',
        incomplete_reason: 'query_result_limit_reached',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isNotFound() on a 404 response', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/blocks/unknown-id`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Block not found'), {
            status: 404,
          }),
        ),
      );

      try {
        await notion.blocks.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
