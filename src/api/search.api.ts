import type { NotionClient } from '../client';
import {
  databaseSchema,
  type NotionDatabase,
  type NotionPage,
  pageSchema,
  type PaginatedList,
  type PaginationParameters,
} from '../schemas';
import { Database, Page } from '../models';

/**
 * Search filter object type.
 */
export type SearchFilterObject = 'page' | 'database';

/**
 * Search filter configuration.
 */
export interface SearchFilter {
  /** Filter by object type */
  value: SearchFilterObject;

  /** Property to filter on (always "object" for this filter type) */
  property: 'object';
}

/**
 * Search sort configuration.
 */
export interface SearchSort {
  /** Sort by timestamp */
  timestamp: 'last_edited_time';

  /** Sort direction */
  direction: 'ascending' | 'descending';
}

/**
 * Options for searching.
 */
export interface SearchOptions extends PaginationParameters {
  /** Search query string */
  query?: string;

  /** Filter configuration */
  filter?: SearchFilter;

  /** Sort configuration */
  sort?: SearchSort;
}

/**
 * Search result item (can be a page or database).
 */
export type SearchResult = Page | Database;

/**
 * Search API client for searching across the workspace.
 */
export class SearchAPI {
  constructor(private readonly client: NotionClient) {}

  /**
   * Search across all pages and databases in the workspace.
   *
   * @param options - Search options (query, filter, sort, pagination)
   * @returns Paginated list of pages and/or databases matching the search
   *
   * @see https://developers.notion.com/reference/post-search
   */
  async query(options?: SearchOptions): Promise<PaginatedList<SearchResult>> {
    const body: Record<string, unknown> = {};

    if (options?.query) {
      body.query = options.query;
    }

    if (options?.filter) {
      body.filter = options.filter;
    }

    if (options?.sort) {
      body.sort = options.sort;
    }

    if (options?.page_size) {
      body.page_size = options.page_size;
    }

    if (options?.start_cursor) {
      body.start_cursor = options.start_cursor;
    }

    const response = await this.client.request<PaginatedList<NotionPage | NotionDatabase>>({
      method: 'POST',
      path: '/search',
      body: Object.keys(body).length > 0 ? body : undefined,
    });

    // The API returns mixed results (pages and databases)
    // We need to parse each result based on its object type
    const results: SearchResult[] = response.results.map((item) => {
      if (item.object === 'page') {
        const parsed = pageSchema.parse(item);
        return new Page(parsed);
      } else {
        const parsed = databaseSchema.parse(item);
        return new Database(parsed);
      }
    });

    return {
      object: 'list',
      results,
      next_cursor: response.next_cursor,
      has_more: response.has_more,
      type: 'page_or_database',
    };
  }
}
