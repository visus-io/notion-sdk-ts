import type { NotionClient } from '../client';
import {
  dataSourceSchema,
  type NotionDataSource,
  type NotionPage,
  pageSchema,
  type PaginatedList,
  type PaginationParameters,
} from '../schemas';
import { DataSource, Page } from '../models';

/**
 * Search filter object type.
 * As of API version 2025-09-03, search returns data sources instead of databases.
 */
export type SearchFilterObject = 'page' | 'data_source';

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
 * Search result item (can be a page or data source).
 * As of API version 2025-09-03, search returns data sources instead of databases.
 */
export type SearchResult = Page | DataSource;

/**
 * Search API client for searching across the workspace.
 */
export class SearchAPI {
  constructor(private readonly client: NotionClient) {}

  /**
   * Search across all pages and data sources in the workspace.
   * As of API version 2025-09-03, search returns data sources instead of databases.
   *
   * @param options - Search options (query, filter, sort, pagination)
   * @returns Paginated list of pages and/or data sources matching the search
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

    const response = await this.client.request<PaginatedList<NotionPage | NotionDataSource>>({
      method: 'POST',
      path: '/search',
      body: Object.keys(body).length > 0 ? body : undefined,
    });

    // The API returns mixed results (pages and data sources)
    // We need to parse each result based on its object type
    const results: SearchResult[] = response.results.map((item) => {
      if (item.object === 'page') {
        const parsed = pageSchema.parse(item);
        return new Page(parsed);
      } else {
        const parsed = dataSourceSchema.parse(item);
        return new DataSource(parsed);
      }
    });

    return {
      object: 'list',
      results,
      next_cursor: response.next_cursor,
      has_more: response.has_more,
      type: 'page_or_data_source',
    };
  }
}
