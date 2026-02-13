import type { NotionClient } from '../client';

/**
 * Base API class providing common functionality for all Notion API clients.
 */
export abstract class BaseAPI {
  protected constructor(protected readonly client: NotionClient) {}
}
