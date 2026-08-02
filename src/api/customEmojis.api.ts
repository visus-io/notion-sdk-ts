import type { NotionClient } from '../client';
import {
  customEmojiSchema,
  type NotionCustomEmoji,
  type PaginatedList,
  type PaginationParameters,
} from '../schemas';
import { CustomEmoji } from '../models';
import { BaseAPI } from './base.api';

/**
 * Options for listing custom emojis.
 */
export interface ListCustomEmojisOptions extends PaginationParameters {
  /** Filter custom emojis by exact name match */
  name?: string;
}

/**
 * Custom Emojis API client for working with Notion workspace custom emojis.
 *
 * @category Custom Emoji & Icons
 */
export class CustomEmojisAPI extends BaseAPI<NotionCustomEmoji, CustomEmoji> {
  protected config = {
    schema: customEmojiSchema,
    ModelClass: CustomEmoji,
    listType: 'custom_emoji' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * List the custom emojis available in the workspace (paginated).
   *
   * @param options - Options for filtering by name and paginating results
   * @returns Paginated list of custom emojis
   *
   * @see https://developers.notion.com/reference/list-custom-emojis
   */
  async list(options?: ListCustomEmojisOptions): Promise<PaginatedList<CustomEmoji>> {
    const query: Record<string, string> = {
      ...(options?.name ? { name: options.name } : {}),
      ...this.buildPaginationQuery(options),
    };

    return this.listResources('/custom_emojis', query);
  }
}
