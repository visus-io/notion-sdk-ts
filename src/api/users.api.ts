import type { NotionClient } from '../client';
import { type PaginatedList, type PaginationParameters, userSchema } from '../schemas';
import { User } from '../models';
import { BaseAPI } from './base.api';

/**
 * Users API client for working with Notion users.
 */
export class UsersAPI extends BaseAPI {
  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Retrieve a user by ID.
   *
   * @param userId - The ID of the user to retrieve
   * @returns The user wrapped in a User model
   *
   * @see https://developers.notion.com/reference/get-user
   */
  async retrieve(userId: string): Promise<User> {
    return this.retrieveResource(`/users/${userId}`, userSchema, User);
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
    const query = this.buildPaginationQuery(params);

    return this.listResources('/users', userSchema, User, 'user', query);
  }

  /**
   * Retrieve the bot user associated with the API token.
   *
   * @returns The bot user wrapped in a User model
   *
   * @see https://developers.notion.com/reference/get-self
   */
  async me(): Promise<User> {
    return this.retrieveResource('/users/me', userSchema, User);
  }
}
