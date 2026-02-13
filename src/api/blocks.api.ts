import type { NotionClient } from '../client';
import {
  blockSchema,
  type NotionBlock,
  type PaginatedList,
  paginatedListSchema,
  type PaginationParameters,
} from '../schemas';
import { Block } from '../models';
import { LIMITS, validateArrayLength } from '../validation';
import { BaseAPI } from './base.api';

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
export interface AppendBlockChildrenOptions extends PaginationParameters {
  /** Array of block objects to append (max 100) */
  children: unknown[];

  /** Position to insert the children */
  after?: string;
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

  /** Archive or restore the block */
  archived?: boolean;
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
    const query: Record<string, string> = {
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
}
