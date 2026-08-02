import type { NotionClient } from '../client';
import {
  type BlockPosition,
  blockSchema,
  type MeetingNotesQueryProperty,
  meetingNotesQueryResponseSchema,
  type NotionBlock,
  type PaginatedList,
  paginatedListSchema,
  type PaginationParameters,
  type RequestStatus,
} from '../schemas';
import { Block } from '../models';
import { LIMITS, validateArrayLength } from '../validation';
import { BaseAPI } from './base.api';

/**
 * Filter condition for a meeting-notes query.
 */
export interface MeetingNotesQueryFilterCondition {
  property: MeetingNotesQueryProperty;
  filter: Record<string, unknown>;
}

/**
 * Filter for a meeting-notes query.
 */
export interface MeetingNotesQueryFilter {
  operator: 'and' | 'or';
  filters: MeetingNotesQueryFilterCondition[];
}

/**
 * Sort configuration for a meeting-notes query.
 */
export interface MeetingNotesQuerySort {
  property: string;
  direction: 'ascending' | 'descending';
}

/**
 * Options for querying meeting-notes blocks.
 */
export interface QueryMeetingNotesOptions {
  /** Filter configuration */
  filter?: MeetingNotesQueryFilter;

  /** Sort configuration (max 100) */
  sort?: MeetingNotesQuerySort[];

  /** Maximum number of results to return (1-50, default 50) */
  limit?: number;
}

/**
 * Result of a meeting-notes query. No cursor-based pagination -- only `hasMore`.
 */
export interface MeetingNotesQueryResult {
  results: Block[];
  hasMore: boolean;
  requestStatus?: RequestStatus;
}

/**
 * Options for retrieving a block.
 */
export interface RetrieveBlockOptions {
  /** Filter properties to include in the response */
  filter_properties?: string[];
}

/**
 * Options for appending children to a block.
 */
export interface AppendBlockChildrenOptions {
  /** Array of block objects to append (max 100) */
  children: unknown[];

  /** Position to insert the children (default: end) */
  position?: BlockPosition;
}

/**
 * Response from appending children to a block.
 */
export interface AppendBlockChildrenResponse {
  /** The array of appended block objects */
  results: Block[];

  /** Cursor for pagination (if more than 100 children) */
  next_cursor: string | null;

  /** Whether there are more children to fetch */
  has_more: boolean;
}

/**
 * Options for updating a block.
 */
export interface UpdateBlockOptions {
  /** Block type-specific properties to update (depends on block type) */
  [blockType: string]: unknown;

  /** Move to trash or restore from trash */
  in_trash?: boolean;
}

/**
 * Blocks API client for working with Notion blocks.
 */
export class BlocksAPI extends BaseAPI<NotionBlock, Block> {
  protected config = {
    schema: blockSchema,
    ModelClass: Block,
    listType: 'block' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Retrieve a block by ID.
   *
   * @param blockId - The ID of the block to retrieve (with or without dashes)
   * @param options - Options for filtering properties
   * @returns The block wrapped in a Block model
   *
   * @see https://developers.notion.com/reference/retrieve-a-block
   */
  async retrieve(blockId: string, options?: RetrieveBlockOptions): Promise<Block> {
    const query: Record<string, string | string[]> = {
      ...this.buildFilterPropertiesQuery(options?.filter_properties),
    };

    return this.retrieveResource(`/blocks/${blockId}`, query);
  }

  /**
   * Delete (archive) a block.
   *
   * @param blockId - The ID of the block to delete
   * @returns The deleted block wrapped in a Block model
   *
   * @see https://developers.notion.com/reference/delete-a-block
   */
  async delete(blockId: string): Promise<Block> {
    return this.deleteResource(`/blocks/${blockId}`);
  }

  /**
   * Update a block's properties.
   *
   * @param blockId - The ID of the block to update
   * @param options - Options for updating the block
   * @returns The updated block wrapped in a Block model
   *
   * @see https://developers.notion.com/reference/update-a-block
   */
  async update(blockId: string, options: UpdateBlockOptions): Promise<Block> {
    return this.updateResource(`/blocks/${blockId}`, options);
  }

  /**
   * Block children operations.
   */
  readonly children = {
    /**
     * List all children of a block (paginated).
     *
     * @param blockId - The ID of the parent block
     * @param params - Pagination parameters
     * @returns Paginated list of child blocks
     *
     * @see https://developers.notion.com/reference/get-block-children
     */
    list: async (blockId: string, params?: PaginationParameters): Promise<PaginatedList<Block>> => {
      const query = this.buildPaginationQuery(params);

      return this.listResources(`/blocks/${blockId}/children`, query);
    },

    /**
     * Append children blocks to a parent block.
     *
     * @param blockId - The ID of the parent block
     * @param options - Options for appending children
     * @returns Response with appended blocks
     *
     * @see https://developers.notion.com/reference/patch-block-children
     */
    append: async (
      blockId: string,
      options: AppendBlockChildrenOptions,
    ): Promise<AppendBlockChildrenResponse> => {
      validateArrayLength(options.children, LIMITS.ARRAY_ELEMENTS, 'children');

      const response = await this.client.request<PaginatedList<NotionBlock>>({
        method: 'PATCH',
        path: `/blocks/${blockId}/children`,
        body: options,
      });

      const listSchema = paginatedListSchema(blockSchema);
      const parsed = listSchema.parse(response);

      return {
        results: parsed.results.map((block) => new Block(block)),
        next_cursor: parsed.next_cursor,
        has_more: parsed.has_more,
      };
    },
  };

  /**
   * Meeting-notes query operations.
   */
  readonly meetingNotes = {
    /**
     * Query meeting-notes blocks across the workspace.
     *
     * @param options - Filter, sort, and limit options
     * @returns Matching meeting-notes blocks
     *
     * @see https://developers.notion.com/reference/query-meeting-notes
     */
    query: async (options?: QueryMeetingNotesOptions): Promise<MeetingNotesQueryResult> => {
      if (options?.sort) {
        validateArrayLength(options.sort, LIMITS.ARRAY_ELEMENTS, 'sort');
      }

      const body: Record<string, unknown> = {};

      if (options?.filter) {
        body.filter = options.filter;
      }

      if (options?.sort) {
        body.sort = options.sort;
      }

      if (options?.limit) {
        body.limit = options.limit;
      }

      const response = await this.client.request<unknown>({
        method: 'POST',
        path: '/blocks/meeting_notes/query',
        body: Object.keys(body).length > 0 ? body : undefined,
      });

      const parsed = meetingNotesQueryResponseSchema.parse(response);

      return {
        results: parsed.results.map((b) => new Block(b)),
        hasMore: parsed.has_more,
        requestStatus: parsed.request_status,
      };
    },
  };
}
