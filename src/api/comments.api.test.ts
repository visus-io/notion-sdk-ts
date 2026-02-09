import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentsAPI } from './comments.api';
import type { NotionClient } from '../client';
import { Comment } from '../models';
import { NotionValidationError } from '../validation';

describe('CommentsAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const commentsAPI = new CommentsAPI(mockClient);

  const mockCommentResponse = {
    object: 'comment',
    id: '123e4567-e89b-12d3-a456-426614174000',
    parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
    discussion_id: '423e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    last_edited_time: '2023-01-02T00:00:00.000Z',
    rich_text: [
      {
        type: 'text',
        text: { content: 'This is a comment', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'This is a comment',
        href: null,
      },
    ],
  };

  const mockPaginatedResponse = {
    object: 'list',
    results: [mockCommentResponse],
    next_cursor: null,
    has_more: false,
    type: 'comment',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should list comments for a page without pagination params', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      const result = await commentsAPI.list('page-id-123');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/comments',
        query: {
          block_id: 'page-id-123',
        },
      });
      expect(result.object).toBe('list');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Comment);
      expect(result.type).toBe('comment');
    });

    it('should list comments with pagination params', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      await commentsAPI.list('page-id-123', {
        page_size: 50,
        start_cursor: 'cursor123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/comments',
        query: {
          block_id: 'page-id-123',
          page_size: '50',
          start_cursor: 'cursor123',
        },
      });
    });

    it('should handle pagination response', async () => {
      const paginatedResponse = {
        ...mockPaginatedResponse,
        next_cursor: 'next-cursor-123',
        has_more: true,
      };
      vi.mocked(mockClient.request).mockResolvedValue(paginatedResponse);

      const result = await commentsAPI.list('page-id-123');

      expect(result.next_cursor).toBe('next-cursor-123');
      expect(result.has_more).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a comment on a page', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockCommentResponse);

      const richText = [{ type: 'text', text: { content: 'New comment' } }];

      const result = await commentsAPI.create({
        parent: { page_id: 'page-id-123' },
        rich_text: richText,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/comments',
        body: {
          parent: { page_id: 'page-id-123' },
          rich_text: richText,
        },
      });
      expect(result).toBeInstanceOf(Comment);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should create a comment on a block', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockCommentResponse);

      const richText = [{ type: 'text', text: { content: 'Comment on block' } }];

      await commentsAPI.create({
        parent: { block_id: 'block-id-123' },
        rich_text: richText,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/comments',
        body: {
          parent: { block_id: 'block-id-123' },
          rich_text: richText,
        },
      });
    });

    it('should create a comment in a discussion thread', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockCommentResponse);

      const richText = [{ type: 'text', text: { content: 'Reply in thread' } }];

      await commentsAPI.create({
        discussion_id: 'discussion-id-123',
        rich_text: richText,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/comments',
        body: {
          discussion_id: 'discussion-id-123',
          rich_text: richText,
        },
      });
    });

    it('should create a comment with attachments', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockCommentResponse);

      const richText = [{ type: 'text', text: { content: 'Comment with attachments' } }];
      const attachments = [
        { file_upload_id: 'upload-1', type: 'file_upload' as const },
        { file_upload_id: 'upload-2', type: 'file_upload' as const },
      ];

      await commentsAPI.create({
        parent: { page_id: 'page-id-123' },
        rich_text: richText,
        attachments,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/comments',
        body: {
          parent: { page_id: 'page-id-123' },
          rich_text: richText,
          attachments,
        },
      });
    });

    it('should create a comment with custom display name', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockCommentResponse);

      const richText = [{ type: 'text', text: { content: 'Comment with custom name' } }];

      await commentsAPI.create({
        parent: { page_id: 'page-id-123' },
        rich_text: richText,
        display_name: { type: 'custom', custom: { name: 'Custom Bot' } },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/comments',
        body: {
          parent: { page_id: 'page-id-123' },
          rich_text: richText,
          display_name: { type: 'custom', custom: { name: 'Custom Bot' } },
        },
      });
    });

    it('should throw validation error when rich_text array exceeds limit', async () => {
      const tooManyRichTextElements = new Array(101).fill({ type: 'text', text: { content: 'x' } });

      await expect(
        commentsAPI.create({
          parent: { page_id: 'page-id-123' },
          rich_text: tooManyRichTextElements,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should throw validation error when attachments array exceeds limit', async () => {
      const tooManyAttachments = new Array(4).fill({
        file_upload_id: 'upload-id',
        type: 'file_upload',
      });

      await expect(
        commentsAPI.create({
          parent: { page_id: 'page-id-123' },
          rich_text: [{ type: 'text', text: { content: 'Comment' } }],
          attachments: tooManyAttachments,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should create a comment with integration display name', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockCommentResponse);

      const richText = [{ type: 'text', text: { content: 'Integration comment' } }];

      await commentsAPI.create({
        parent: { page_id: 'page-id-123' },
        rich_text: richText,
        display_name: { type: 'integration' },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/comments',
        body: {
          parent: { page_id: 'page-id-123' },
          rich_text: richText,
          display_name: { type: 'integration' },
        },
      });
    });

    it('should create a comment with user display name', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockCommentResponse);

      const richText = [{ type: 'text', text: { content: 'User comment' } }];

      await commentsAPI.create({
        parent: { page_id: 'page-id-123' },
        rich_text: richText,
        display_name: { type: 'user' },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/comments',
        body: {
          parent: { page_id: 'page-id-123' },
          rich_text: richText,
          display_name: { type: 'user' },
        },
      });
    });
  });
});
