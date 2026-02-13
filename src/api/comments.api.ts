import type { NotionClient } from '../client';
import { commentSchema, type PaginatedList, type PaginationParameters } from '../schemas';
import { Comment } from '../models';
import { LIMITS, validateArrayLength } from '../validation';
import { BaseAPI } from './base.api';

/**
 * Display name for a comment.
 */
export type CommentDisplayName =
  | { type: 'integration' }
  | { type: 'user' }
  | { type: 'custom'; custom: { name: string } };

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

  /** The comment content as rich text array (max 100 items) */
  rich_text: unknown[];

  /** File attachments (max 3 allowed) */
  attachments?: CommentAttachment[];

  /** Custom display name for the comment */
  display_name?: CommentDisplayName;
}

/**
 * Comments API client for working with Notion comments.
 */
export class CommentsAPI extends BaseAPI {
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

    return this.listResources('/comments', commentSchema, Comment, 'comment', query);
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
    validateArrayLength(options.rich_text, LIMITS.ARRAY_ELEMENTS, 'rich_text');
    if (options.attachments) {
      validateArrayLength(options.attachments, LIMITS.COMMENT_ATTACHMENTS, 'attachments');
    }

    return this.createResource('/comments', options, commentSchema, Comment);
  }
}
