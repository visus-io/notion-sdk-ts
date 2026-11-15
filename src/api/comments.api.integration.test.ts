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

  describe('create with markdown', () => {
    it('should create a comment from a markdown string', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/comments`, async ({ request }) => {
          const body = (await request.json()) as { markdown?: string; rich_text?: unknown };
          expect(body.markdown).toBe('Nice **work**!');
          expect(body.rich_text).toBeUndefined();
          return HttpResponse.json(buildCommentResponse());
        }),
      );

      const result = await notion.comments.create({
        parent: { page_id: pageId },
        markdown: 'Nice **work**!',
      });

      expect(result).toBeInstanceOf(Comment);
    });
  });

  describe('update', () => {
    it('should update a comment over the network', async () => {
      const commentId = '323e4567-e89b-12d3-a456-426614174000';

      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/comments/${commentId}`, async ({ request }) => {
          const body = (await request.json()) as { markdown?: string };
          expect(body.markdown).toBe('Updated comment');
          return HttpResponse.json(buildCommentResponse({ id: commentId }));
        }),
      );

      const result = await notion.comments.update(commentId, { markdown: 'Updated comment' });

      expect(result).toBeInstanceOf(Comment);
      expect(result.id).toBe(commentId);
    });
  });

  describe('delete', () => {
    it('should delete a comment over the network', async () => {
      const commentId = '323e4567-e89b-12d3-a456-426614174000';

      server.use(
        http.delete(`${NOTION_TEST_BASE_URL}/v1/comments/${commentId}`, () =>
          HttpResponse.json(buildCommentResponse({ id: commentId })),
        ),
      );

      const result = await notion.comments.delete(commentId);

      expect(result).toBeInstanceOf(Comment);
      expect(result.id).toBe(commentId);
    });
  });

  // ---------------------------------------------------------------------------
  // Changelog 2026-10 / 2026-11 additions
  // ---------------------------------------------------------------------------

  describe('changelog additions', () => {
    it('should send markdown_version and parse property_id on a property comment', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/comments`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.markdown_version).toBe('v2');
          return HttpResponse.json(buildCommentResponse({ property_id: 'abc%3D' }));
        }),
      );

      const result = await notion.comments.create({
        parent: { page_id: '223e4567-e89b-12d3-a456-426614174000' },
        markdown: '**Looks good**',
        markdown_version: 'v2',
      });

      expect(result).toBeInstanceOf(Comment);
      expect(result.propertyId).toBe('abc%3D');
    });

    it('should send markdown_version when updating a comment', async () => {
      const commentId = '123e4567-e89b-12d3-a456-426614174000';
      server.use(
        http.patch(`${NOTION_TEST_BASE_URL}/v1/comments/${commentId}`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.markdown_version).toBe('v2');
          return HttpResponse.json(buildCommentResponse());
        }),
      );

      const result = await notion.comments.update(commentId, {
        markdown: 'Edited',
        markdown_version: 'v2',
      });

      expect(result.propertyId).toBeUndefined();
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
