import type { PaginatedList } from '../schemas';

/**
 * Pagination helpers that collect all results from paginated Notion API endpoints.
 *
 * The Notion API uses cursor-based pagination. Each list endpoint returns a
 * `PaginatedList<T>` object with `results`, `next_cursor`, and `has_more` properties.
 * These helpers fetch every page automatically.
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
 * This function receives an optional cursor. It returns the next page of results.
 *
 * @category Pagination
 */
export type PaginatedFetchFunction<T> = (cursor?: string) => Promise<PaginatedList<T>>;

/**
 * Collects all results from a paginated endpoint by automatically following cursors.
 *
 * This function fetches pages until `has_more` is `false`. It collects all results
 * into one array. Use this function when you need all results at once.
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
 *
 * @category Pagination
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
 * This function iterates over large result sets without loading everything into
 * memory. It fetches one page at a time and yields items as needed. Use this function
 * with `for await...of` to process results one at a time.
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
 *
 * @category Pagination
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
 * Collects all results. Returns the items together with pagination metadata.
 *
 * Use this function when you need the page count or the total number of API
 * calls.
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
 *
 * @category Pagination
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

// ---------------------------------------------------------------------------
// Windowed collection for capped data source / view queries
// ---------------------------------------------------------------------------

/**
 * Fetch function for windowed row collection. It extends
 * {@link PaginatedFetchFunction} with a second parameter: the ISO 8601
 * `created_time` lower bound for the next window. This parameter appears only
 * after the previous window hits the query result limit
 * (`request_status.type === 'incomplete'`). Merge this bound into your own
 * created_time-ascending query, for example
 * `filter.createdTime().onOrAfter(createdTimeCursor)`.
 *
 * @category Pagination
 */
export type WindowedFetchFunction<T extends { id: string; createdTime: Date }> = (
  cursor: string | undefined,
  createdTimeCursor: string | undefined,
) => Promise<PaginatedList<T>>;

/**
 * Iterates over every row of a data source query. It works around the API's
 * 10,000-result-per-query cap.
 *
 * Data source and view queries cap at 10,000 results. When a query hits this cap, the
 * response's `has_more` field is still `false`. Following `next_cursor` and `has_more`
 * alone silently truncates the result set. When a window hits the cap
 * (`request_status.type === 'incomplete'`), this function starts a new query filtered
 * to `created_time >=` the last row seen. It de-duplicates rows by `id` across the
 * window boundary. The query must sort by `created_time` in ascending order.
 *
 * @param fetchWindow - Function that fetches one page. Pass the current cursor. After
 * a window hits the cap, also pass a `created_time` lower bound for the next window.
 * @yields Individual rows across all windows
 *
 * @example
 * ```typescript
 * const rows = collectAllDataSourceRows((cursor, createdTimeCursor) =>
 *   notion.dataSources.query(dataSourceId, {
 *     start_cursor: cursor,
 *     sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
 *     filter: createdTimeCursor
 *       ? filter.and(baseFilter, filter.createdTime().onOrAfter(createdTimeCursor))
 *       : baseFilter,
 *   }),
 * );
 * ```
 *
 * @category Pagination
 */
export async function* iterateAllDataSourceRows<T extends { id: string; createdTime: Date }>(
  fetchWindow: WindowedFetchFunction<T>,
): AsyncGenerator<T, void, undefined> {
  const seenIds = new Set<string>();
  let cursor: string | undefined;
  let createdTimeCursor: string | undefined;
  let lastCreatedTime: Date | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchWindow(cursor, createdTimeCursor);
    let yieldedThisWindow = false;

    for (const item of response.results) {
      if (seenIds.has(item.id)) {
        continue;
      }
      seenIds.add(item.id);
      lastCreatedTime = item.createdTime;
      yieldedThisWindow = true;
      yield item;
    }

    if (response.request_status?.type === 'incomplete' && lastCreatedTime) {
      // has_more is false here, so normal cursor pagination would silently stop short.
      // Start a fresh window scoped to created_time >= the last row seen, de-duping by
      // id across the boundary (created_time, not last_edited_time -- the latter shifts
      // rows between windows).
      if (!yieldedThisWindow) {
        // Every row in this capped window was already seen, meaning more rows share
        // this exact created_time than fit in one window -- the created_time >= filter
        // can't disambiguate further, so re-querying would return the same page forever.
        throw new Error(
          `More than one window's worth of rows share the same created_time (${lastCreatedTime.toISOString()}); ` +
            'iterateAllDataSourceRows cannot make forward progress past this timestamp.',
        );
      }
      cursor = undefined;
      createdTimeCursor = lastCreatedTime.toISOString();
      hasMore = true;
    } else {
      cursor = response.next_cursor ?? undefined;
      hasMore = cursor !== undefined;
    }
  }
}

/**
 * Collects every row of a data source query into an array. It works around the API's
 * 10,000-result-per-query cap. See {@link iterateAllDataSourceRows} for the windowing
 * behavior.
 *
 * @param fetchWindow - Function that fetches one page. Pass the current cursor. After
 * a window hits the cap, also pass a `created_time` lower bound for the next window.
 * @returns Array containing all rows across all windows
 *
 * @category Pagination
 */
export async function collectAllDataSourceRows<T extends { id: string; createdTime: Date }>(
  fetchWindow: WindowedFetchFunction<T>,
): Promise<T[]> {
  const all: T[] = [];
  for await (const item of iterateAllDataSourceRows(fetchWindow)) {
    all.push(item);
  }
  return all;
}
