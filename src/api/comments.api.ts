import type { NotionClient } from '../client';
import {
  commentSchema,
  type NotionComment,
  type PaginatedList,
  paginatedListSchema,
  type PaginationParameters,
} from '../schemas';
import { Comment } from '../models';
import { LIMITS, validateArrayLength } from '../validation';

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
export class CommentsAPI {
  constructor(private readonly client: NotionClient) {}

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
    };

    if (params?.page_size) {
      query.page_size = String(params.page_size);
    }

    if (params?.start_cursor) {
      query.start_cursor = params.start_cursor;
    }

    const response = await this.client.request<PaginatedList<NotionComment>>({
      method: 'GET',
      path: '/comments',
      query,
    });

    const listSchema = paginatedListSchema(commentSchema);
    const parsed = listSchema.parse(response);

    return {
      object: 'list',
      results: parsed.results.map((comment) => new Comment(comment)),
      next_cursor: parsed.next_cursor,
      has_more: parsed.has_more,
      type: 'comment',
    };
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

    const response = await this.client.request<NotionComment>({
      method: 'POST',
      path: '/comments',
      body: options,
    });

    const parsed = commentSchema.parse(response);
    return new Comment(parsed);
  }
}
