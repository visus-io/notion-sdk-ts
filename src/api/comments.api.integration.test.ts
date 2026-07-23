import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { Comment } from '../models';
import { Notion } from '../notion';
import { buildCommentResponse, buildErrorBody } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('CommentsAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });
  const pageId = '223e4567-e89b-12d3-a456-426614174000';

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('list', () => {
    it('should list comments for a page and send block_id as a query parameter', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/comments`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('block_id')).toBe(pageId);
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          return HttpResponse.json({
            object: 'list',
            results: [buildCommentResponse()],
            next_cursor: null,
            has_more: false,
            type: 'comment',
          });
        }),
      );

      const result = await notion.comments.list(pageId);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Comment);
    });
  });

  describe('create', () => {
    it('should create a comment on a page', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/comments`, () =>
          HttpResponse.json(buildCommentResponse()),
        ),
      );

      const result = await notion.comments.create({
        parent: { page_id: pageId },
        rich_text: [{ type: 'text', text: { content: 'Nice work!' } }],
      });

      expect(result).toBeInstanceOf(Comment);
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isValidationError() on an invalid discussion', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/comments`, () =>
          HttpResponse.json(buildErrorBody(400, 'validation_error', 'discussion_id is not valid'), {
            status: 400,
          }),
        ),
      );

      try {
        await notion.comments.create({
          discussion_id: 'not-a-real-discussion',
          rich_text: [{ type: 'text', text: { content: 'Reply' } }],
        });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isValidationError()).toBe(true);
      }
    });
  });
});
