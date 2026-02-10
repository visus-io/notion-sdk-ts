import type { PaginatedList } from '../schemas';

/**
 * Pagination helper utilities for collecting all results from paginated Notion API endpoints.
 *
 * The Notion API uses cursor-based pagination. All list endpoints return a `PaginatedList<T>`
 * with `results`, `next_cursor`, and `has_more` properties. These helpers automate the process
 * of fetching all pages.
 *
 * @example
 * ```typescript
 * import { Notion, paginate } from '@visus-io/notion-sdk-ts';
 *
 * const notion = new Notion({ auth: process.env.NOTION_TOKEN });
 *
 * // Collect all blocks from a page
 * const allBlocks = await paginate((cursor) =>
 *   notion.blocks.children.list('page-id', { start_cursor: cursor, page_size: 100 })
 * );
 *
 * // Collect all pages from a database query
 * const allPages = await paginate((cursor) =>
 *   notion.databases.query('database-id', {
 *     start_cursor: cursor,
 *     filter: filter.status('Status').equals('Active'),
 *   })
 * );
 *
 * // Iterate through pages one at a time
 * for await (const block of paginateIterator((cursor) =>
 *   notion.blocks.children.list('page-id', { start_cursor: cursor })
 * )) {
 *   console.log(block.type);
 * }
 * ```
 */

/**
 * Fetch function that returns a paginated list.
 * Receives an optional cursor and returns the next page of results.
 */
export type PaginatedFetchFunction<T> = (cursor?: string) => Promise<PaginatedList<T>>;

/**
 * Collects all results from a paginated endpoint by automatically following cursors.
 *
 * This function will keep fetching pages until `has_more` is `false`, collecting all
 * results into a single array. Use this when you need all results at once.
 *
 * @param fetchPage - Function that fetches a single page of results
 * @returns Array containing all results from all pages
 *
 * @example
 * ```typescript
 * // Get all blocks from a page
 * const blocks = await paginate((cursor) =>
 *   notion.blocks.children.list('page-id', { start_cursor: cursor, page_size: 100 })
 * );
 *
 * // Get all pages from a database query with filters
 * const pages = await paginate((cursor) =>
 *   notion.databases.query('database-id', {
 *     start_cursor: cursor,
 *     page_size: 100,
 *     filter: filter.status('Status').equals('Active'),
 *   })
 * );
 *
 * // Get all comments on a page
 * const comments = await paginate((cursor) =>
 *   notion.comments.list('page-id', { start_cursor: cursor })
 * );
 *
 * // Get all users in workspace
 * const users = await paginate((cursor) =>
 *   notion.users.list({ start_cursor: cursor })
 * );
 *
 * // Search all pages
 * const searchResults = await paginate((cursor) =>
 *   notion.search.query({
 *     query: 'project',
 *     filter: { property: 'object', value: 'page' },
 *     start_cursor: cursor,
 *   })
 * );
 * ```
 */
export async function paginate<T>(fetchPage: PaginatedFetchFunction<T>): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;

  do {
    const response = await fetchPage(cursor);
    all.push(...response.results);
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return all;
}

/**
 * Creates an async iterator that yields individual items from paginated results.
 *
 * This function provides memory-efficient iteration over large result sets by fetching
 * one page at a time and yielding items as needed. Use this with `for await...of` when
 * you want to process results one by one without loading everything into memory.
 *
 * @param fetchPage - Function that fetches a single page of results
 * @yields Individual items from each page
 *
 * @example
 * ```typescript
 * // Process blocks one at a time
 * for await (const block of paginateIterator((cursor) =>
 *   notion.blocks.children.list('page-id', { start_cursor: cursor })
 * )) {
 *   console.log(block.type, block.id);
 *   if (block.isTextBlock()) {
 *     console.log(block.getPlainText());
 *   }
 * }
 *
 * // Process database pages one at a time with filtering
 * for await (const page of paginateIterator((cursor) =>
 *   notion.databases.query('database-id', {
 *     start_cursor: cursor,
 *     filter: filter.status('Status').equals('Active'),
 *   })
 * )) {
 *   console.log(page.getTitle());
 *   // Process page without loading all pages into memory
 * }
 *
 * // Process search results one at a time
 * for await (const result of paginateIterator((cursor) =>
 *   notion.search.query({ query: 'meeting', start_cursor: cursor })
 * )) {
 *   console.log(result.url);
 * }
 * ```
 */
export async function* paginateIterator<T>(
  fetchPage: PaginatedFetchFunction<T>,
): AsyncGenerator<T, void, undefined> {
  let cursor: string | undefined;

  do {
    const response = await fetchPage(cursor);
    for (const item of response.results) {
      yield item;
    }
    cursor = response.next_cursor ?? undefined;
  } while (cursor);
}

/**
 * Collects all results and returns both the items and pagination metadata.
 *
 * This function is useful when you need to know how many pages were fetched
 * or want to track the total number of API calls made.
 *
 * @param fetchPage - Function that fetches a single page of results
 * @returns Object containing all results and pagination metadata
 *
 * @example
 * ```typescript
 * const { items, pageCount, totalCount } = await paginateWithMetadata((cursor) =>
 *   notion.blocks.children.list('page-id', { start_cursor: cursor })
 * );
 *
 * console.log(`Fetched ${totalCount} blocks across ${pageCount} pages`);
 * ```
 */
export async function paginateWithMetadata<T>(fetchPage: PaginatedFetchFunction<T>): Promise<{
  items: T[];
  pageCount: number;
  totalCount: number;
}> {
  const items: T[] = [];
  let cursor: string | undefined;
  let pageCount = 0;

  do {
    const response = await fetchPage(cursor);
    items.push(...response.results);
    cursor = response.next_cursor ?? undefined;
    pageCount++;
  } while (cursor);

  return {
    items,
    pageCount,
    totalCount: items.length,
  };
}
