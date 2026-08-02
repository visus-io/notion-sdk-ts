import type { NotionClient } from '../client';
import {
  commentSchema,
  type NotionComment,
  type PaginatedList,
  type PaginationParameters,
} from '../schemas';
import { Comment } from '../models';
import { LIMITS, NotionValidationError, validateArrayLength } from '../validation';
import { BaseAPI } from './base.api';

/**
 * Display name for a comment.
 */
export type CommentDisplayName =
  { type: 'integration' } | { type: 'user' } | { type: 'custom'; custom: { name: string } };

/**
 * Comment attachment (file upload reference).
 */
export interface CommentAttachment {
  /** ID of a FileUpload object that has status "uploaded" */
  file_upload_id: string;

  /** Always "file_upload" */
  type: 'file_upload';
}

/**
 * Options for creating a comment.
 */
export interface CreateCommentOptions {
  /** The parent page or block to comment on */
  parent?: { page_id: string } | { block_id: string };

  /** Optional discussion thread ID to add the comment to */
  discussion_id?: string;

  /** The comment content as rich text array (max 100 items). Exactly one of `rich_text`/`markdown` must be provided. */
  rich_text?: unknown[];

  /** The comment content as a markdown string (inline formatting only). Exactly one of `rich_text`/`markdown` must be provided. */
  markdown?: string;

  /** File attachments (max 3 allowed) */
  attachments?: CommentAttachment[];

  /** Custom display name for the comment */
  display_name?: CommentDisplayName;
}

/**
 * Options for updating a comment.
 */
export interface UpdateCommentOptions {
  /** The comment content as rich text array (max 100 items). Exactly one of `rich_text`/`markdown` must be provided. */
  rich_text?: unknown[];

  /** The comment content as a markdown string (inline formatting only). Exactly one of `rich_text`/`markdown` must be provided. */
  markdown?: string;
}

/**
 * Assert that exactly one of `rich_text`/`markdown` is provided for a comment body.
 *
 * @throws {NotionValidationError}
 */
function validateCommentContent(options: { rich_text?: unknown[]; markdown?: string }): void {
  const hasRichText = options.rich_text !== undefined;
  const hasMarkdown = options.markdown !== undefined;

  if (hasRichText === hasMarkdown) {
    throw new NotionValidationError('Exactly one of rich_text or markdown must be provided');
  }
}

/**
 * Comments API client for working with Notion comments.
 */
export class CommentsAPI extends BaseAPI<NotionComment, Comment> {
  protected config = {
    schema: commentSchema,
    ModelClass: Comment,
    listType: 'comment' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Retrieve all comments from a page or block (paginated).
   *
   * @param parentId - The ID of the parent page, block, or database
   * @param params - Pagination parameters
   * @returns Paginated list of comments
   *
   * @see https://developers.notion.com/reference/retrieve-a-comment
   */
  async list(parentId: string, params?: PaginationParameters): Promise<PaginatedList<Comment>> {
    const query: Record<string, string> = {
      block_id: parentId, // Can be page_id, block_id, or database_id
      ...this.buildPaginationQuery(params),
    };

    return this.listResources('/comments', query);
  }

  /**
   * Create a new comment on a page or block.
   *
   * @param options - Options for creating the comment
   * @returns The created comment wrapped in a Comment model
   *
   * @see https://developers.notion.com/reference/create-a-comment
   */
  async create(options: CreateCommentOptions): Promise<Comment> {
    validateCommentContent(options);
    if (options.rich_text) {
      validateArrayLength(options.rich_text, LIMITS.ARRAY_ELEMENTS, 'rich_text');
    }
    if (options.attachments) {
      validateArrayLength(options.attachments, LIMITS.COMMENT_ATTACHMENTS, 'attachments');
    }

    return this.createResource('/comments', options);
  }

  /**
   * Update an existing comment's content.
   *
   * @param commentId - The ID of the comment to update
   * @param options - The updated comment content (`rich_text` or `markdown`)
   * @returns The updated comment wrapped in a Comment model
   *
   * @see https://developers.notion.com/reference/update-a-comment
   */
  async update(commentId: string, options: UpdateCommentOptions): Promise<Comment> {
    validateCommentContent(options);
    if (options.rich_text) {
      validateArrayLength(options.rich_text, LIMITS.ARRAY_ELEMENTS, 'rich_text');
    }

    return this.updateResource(`/comments/${commentId}`, options);
  }

  /**
   * Delete a comment. A connection can only delete comments it created.
   *
   * @param commentId - The ID of the comment to delete
   * @returns The deleted comment wrapped in a Comment model
   *
   * @see https://developers.notion.com/reference/delete-a-comment
   */
  async delete(commentId: string): Promise<Comment> {
    return this.deleteResource(`/comments/${commentId}`);
  }
}
