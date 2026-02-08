import type { NotionClient } from '../client';
import {
  type NotionUser,
  type PaginatedList,
  paginatedListSchema,
  type PaginationParameters,
  userSchema,
} from '../schemas';
import { User } from '../models';

/**
 * Users API client for working with Notion users.
 */
export class UsersAPI {
  constructor(private readonly client: NotionClient) {}

  /**
   * Retrieve a user by ID.
   *
   * @param userId - The ID of the user to retrieve
   * @returns The user wrapped in a User model
   *
   * @see https://developers.notion.com/reference/get-user
   */
  async retrieve(userId: string): Promise<User> {
    const response = await this.client.request<NotionUser>({
      method: 'GET',
      path: `/users/${userId}`,
    });

    const parsed = userSchema.parse(response);
    return new User(parsed);
  }

  /**
   * List all users in the workspace (paginated).
   *
   * @param params - Pagination parameters
   * @returns Paginated list of users
   *
   * @see https://developers.notion.com/reference/get-users
   */
  async list(params?: PaginationParameters): Promise<PaginatedList<User>> {
    const query: Record<string, string> = {};

    if (params?.page_size) {
      query.page_size = String(params.page_size);
    }

    if (params?.start_cursor) {
      query.start_cursor = params.start_cursor;
    }

    const response = await this.client.request<PaginatedList<NotionUser>>({
      method: 'GET',
      path: '/users',
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    const listSchema = paginatedListSchema(userSchema);
    const parsed = listSchema.parse(response);

    return {
      object: 'list',
      results: parsed.results.map((user) => new User(user)),
      next_cursor: parsed.next_cursor,
      has_more: parsed.has_more,
      type: 'user',
    };
  }

  /**
   * Retrieve the bot user associated with the API token.
   *
   * @returns The bot user wrapped in a User model
   *
   * @see https://developers.notion.com/reference/get-self
   */
  async me(): Promise<User> {
    const response = await this.client.request<NotionUser>({
      method: 'GET',
      path: '/users/me',
    });

    const parsed = userSchema.parse(response);
    return new User(parsed);
  }
}
