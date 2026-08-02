---
title: Pagination
description: Automatic pagination helpers and patterns.
sidebar:
  order: 4
---

Use the built-in pagination helpers to handle paginated API responses.

## Table of Contents

- [Understanding Pagination](#understanding-pagination)
- [Paginated List Structure](#paginated-list-structure)
- [Pagination Helpers](#pagination-helpers)
- [Working Around the 10,000-Result Query Cap](#working-around-the-10000-result-query-cap)
- [Paginated Endpoints](#paginated-endpoints)
- [Advanced Patterns](#advanced-patterns)

---

## Understanding Pagination

Notion's API uses cursor-based pagination for list endpoints. Responses include:

- `results`: array of items on the current page.
- `next_cursor`: cursor for the next page. `null` if no more results exist.
- `has_more`: boolean. `true` if more results exist.

### Why Pagination?

The API splits large datasets across multiple requests to:

- Reduce response size
- Improve performance
- Comply with API rate limits

---

## Paginated List Structure

All list endpoints return a `PaginatedList<T>`:

```typescript
interface PaginatedList<T> {
  results: T[]; // Items on this page
  next_cursor: string | null; // Cursor for next page
  has_more: boolean; // Whether more results exist
}
```

### Manual Pagination Example

```typescript
// First request
const page1 = await notion.blocks.children.list('page-id', {
  page_size: 50,
});

console.log(`First page: ${page1.results.length} blocks`);
console.log(`Has more: ${page1.has_more}`);

// Next request (if has_more is true)
if (page1.has_more && page1.next_cursor) {
  const page2 = await notion.blocks.children.list('page-id', {
    start_cursor: page1.next_cursor,
    page_size: 50,
  });

  console.log(`Second page: ${page2.results.length} blocks`);
}
```

---

## Pagination Helpers

The SDK provides 3 helpers to automate pagination:

### 1. `paginate()`: Collect All Results

This helper fetches all pages automatically. It returns a single array.

**When to use:** Use this helper for small to medium datasets when you need all results at once.

```typescript
import { paginate } from '@visus-io/notion-sdk-ts';

// Get all blocks from a page
const allBlocks = await paginate((cursor) =>
  notion.blocks.children.list('page-id', {
    start_cursor: cursor,
    page_size: 100,
  }),
);

console.log(`Total blocks: ${allBlocks.length}`);

// Process all results
for (const block of allBlocks) {
  console.log(block.type);
}
```

**Examples:**

```typescript
// All pages from a database query
const pages = await paginate((cursor) =>
  notion.databases.query('database-id', {
    start_cursor: cursor,
    page_size: 100,
    filter: filter.status('Status').equals('Active'),
  }),
);

// All comments on a page
const comments = await paginate((cursor) =>
  notion.comments.list('page-id', { start_cursor: cursor }),
);

// All users in workspace
const users = await paginate((cursor) => notion.users.list({ start_cursor: cursor }));

// All search results
const searchResults = await paginate((cursor) =>
  notion.search.query({
    query: 'project',
    filter: { property: 'object', value: 'page' },
    start_cursor: cursor,
  }),
);
```

### 2. `paginateIterator()`: Memory-Efficient Iteration

This helper processes results one at a time. It does not load all results into memory.

**When to use:** Use this helper for large datasets or when you process items one at a time.

```typescript
import { paginateIterator } from '@visus-io/notion-sdk-ts';

// Process blocks one at a time
for await (const block of paginateIterator((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor }),
)) {
  console.log(block.type, block.id);

  if (block.isTextBlock()) {
    console.log(block.getPlainText());
  }
}
```

**Examples:**

```typescript
// Process database pages one at a time
for await (const page of paginateIterator((cursor) =>
  notion.databases.query('database-id', {
    start_cursor: cursor,
    filter: filter.status('Status').equals('Active'),
  }),
)) {
  console.log(page.getTitle());
  // Process without loading all pages into memory
}

// Stream search results
for await (const result of paginateIterator((cursor) =>
  notion.search.query({ query: 'important', start_cursor: cursor }),
)) {
  console.log(result.url);
}
```

### 3. `paginateWithMetadata()`: Get Statistics

This helper returns results together with pagination statistics.

**When to use:** Use this helper to track API usage or performance.

```typescript
import { paginateWithMetadata } from '@visus-io/notion-sdk-ts';

const { items, pageCount, totalCount } = await paginateWithMetadata((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor }),
);

console.log(`Fetched ${totalCount} blocks across ${pageCount} API calls`);
console.log(`Average per page: ${totalCount / pageCount}`);
```

**Example with Query:**

```typescript
const { items, pageCount, totalCount } = await paginateWithMetadata((cursor) =>
  notion.databases.query('database-id', {
    start_cursor: cursor,
    page_size: 50,
    filter: filter.status('Status').equals('Done'),
  }),
);

console.log(`Found ${totalCount} completed tasks`);
console.log(`API calls made: ${pageCount}`);
```

---

## Working Around the 10,000-Result Query Cap

Data source, view, and meeting-notes queries cap at **10,000 results**. When a query hits the
cap, the response's `has_more` field is still `false`. If you follow only `next_cursor` and
`has_more` with `paginate()` or `paginateIterator()`, the result set is **silently truncated**.
The SDK does not raise an error in this case.

### Detecting the Cap

The API signals the cap with a `request_status` field on the paginated response:

```typescript
interface RequestStatus {
  type: 'incomplete';
  incomplete_reason: 'query_result_limit_reached';
}
```

`dataSources.query()`, `views.queries.create()`, `views.queries.get()`, and
`blocks.meetingNotes.query()` all expose this field as `request_status`. On the view and
meeting-notes result types, the field is camelCased as `requestStatus`. If you build your own
pagination loop against one of these endpoints, check this field directly. `has_more` and
`next_cursor` do not show that the cap was hit.

### `iterateAllDataSourceRows()` and `collectAllDataSourceRows()`

These helpers work around the cap for data source queries. They chain `created_time`-windowed
queries. When a window hits the cap, the SDK starts a new query scoped to
`created_time >= <last row's createdTime>`. The SDK removes duplicate rows by `id` across the
window boundary.

**Requirements:**

- The underlying query **must** be sorted by `created_time` in ascending order.
- `T` must have `id: string` and `createdTime: Date`. Every model returned by
  `dataSources.query()` meets this requirement.
- The helper throws an error if every row in a window is a duplicate the SDK already saw. This
  means more rows share the exact same `created_time` value than fit in a single window. The
  `created_time >=` filter cannot narrow the query further, so no forward progress is possible.

```typescript
import { collectAllDataSourceRows, filter } from '@visus-io/notion-sdk-ts';

const baseFilter = filter.status('Status').equals('Active');

const rows = await collectAllDataSourceRows((cursor, createdTimeCursor) =>
  notion.dataSources.query(dataSourceId, {
    start_cursor: cursor,
    sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    filter: createdTimeCursor
      ? filter.and(baseFilter, filter.createdTime().onOrAfter(createdTimeCursor))
      : baseFilter,
  }),
);
```

`iterateAllDataSourceRows()` is the memory-efficient counterpart. It uses `for await...of` and
has the same windowing behavior, but it returns one row at a time:

```typescript
import { iterateAllDataSourceRows } from '@visus-io/notion-sdk-ts';

for await (const row of iterateAllDataSourceRows((cursor, createdTimeCursor) =>
  notion.dataSources.query(dataSourceId, {
    start_cursor: cursor,
    sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    filter: createdTimeCursor ? filter.createdTime().onOrAfter(createdTimeCursor) : undefined,
  }),
)) {
  console.log(row.id);
}
```

### Other Endpoints Subject to the Same Cap

[`views.queries.create()`](/api/) and [`blocks.meetingNotes.query()`](/api/) can hit the same
10,000-result cap. Neither endpoint has a dedicated windowing helper. View queries also expire
about 15 minutes after creation. Meeting-notes queries support only a `limit` up to 50, with no
cursor at all. Check the `requestStatus` field on these endpoints. If you suspect truncation,
narrow the query, for example by date range.

---

## Paginated Endpoints

These endpoints support pagination:

| Endpoint                 | Helper Usage                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `blocks.children.list()` | `paginate((c) => notion.blocks.children.list('id', { start_cursor: c }))` |
| `comments.list()`        | `paginate((c) => notion.comments.list('id', { start_cursor: c }))`        |
| `databases.query()`      | `paginate((c) => notion.databases.query('id', { start_cursor: c }))`      |
| `dataSources.query()`    | `paginate((c) => notion.dataSources.query('id', { start_cursor: c }))`    |
| `search.query()`         | `paginate((c) => notion.search.query({ start_cursor: c }))`               |
| `users.list()`           | `paginate((c) => notion.users.list({ start_cursor: c }))`                 |

> **Note:** `dataSources.query()`, `views.queries.create()`, and `blocks.meetingNotes.query()`
> cap at 10,000 results. `paginate()` and `paginateIterator()` alone will silently truncate the
> result set past that cap. See
> [Working Around the 10,000-Result Query Cap](#working-around-the-10000-result-query-cap).

---

## Advanced Patterns

### Control Page Size

Adjust `page_size` to balance the number of API calls against the response size. The maximum
value is 100:

```typescript
// Fewer, larger requests
const blocks = await paginate((cursor) =>
  notion.blocks.children.list('page-id', {
    start_cursor: cursor,
    page_size: 100, // Maximum allowed
  }),
);

// More, smaller requests (useful for rate limit management)
const pages = await paginate((cursor) =>
  notion.databases.query('database-id', {
    start_cursor: cursor,
    page_size: 10, // Smaller batches
  }),
);
```

### Manual Pagination with Full Control

Use this pattern for full control over the pagination flow:

```typescript
let cursor: string | null | undefined = undefined;
let allResults: Block[] = [];
let pageNum = 0;

do {
  const response = await notion.blocks.children.list('page-id', {
    start_cursor: cursor,
    page_size: 50,
  });

  pageNum++;
  console.log(`Page ${pageNum}: ${response.results.length} items`);

  allResults.push(...response.results);
  cursor = response.next_cursor;

  // Optional: Add delay between requests
  if (cursor) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
} while (cursor);

console.log(`Total results: ${allResults.length}`);
```

### Pagination with Filters and Sorts

Combine pagination helpers with filters and sorts:

```typescript
import { filter, sort, paginate } from '@visus-io/notion-sdk-ts';

const highPriorityTasks = await paginate((cursor) =>
  notion.databases.query('database-id', {
    start_cursor: cursor,
    page_size: 100,
    filter: filter.and(
      filter.select('Priority').equals('High'),
      filter.status('Status').doesNotEqual('Done'),
    ),
    sorts: [sort.property('Due Date').ascending(), sort.createdTime().descending()],
  }),
);

console.log(`Found ${highPriorityTasks.length} high-priority tasks`);
```

### Batch Processing with Pagination

Process results in batches while the SDK paginates:

```typescript
async function processPagesInBatches(databaseId: string, batchSize: number) {
  let batch: Page[] = [];

  for await (const page of paginateIterator((cursor) =>
    notion.databases.query(databaseId, { start_cursor: cursor }),
  )) {
    batch.push(page);

    if (batch.length >= batchSize) {
      await processBatch(batch);
      batch = [];
    }
  }

  // Process remaining items
  if (batch.length > 0) {
    await processBatch(batch);
  }
}

async function processBatch(pages: Page[]) {
  console.log(`Processing batch of ${pages.length} pages`);
  // Your batch processing logic
}

await processPagesInBatches('database-id', 25);
```

### Early Termination

Stop pagination when your code meets a condition:

```typescript
import { paginateIterator } from '@visus-io/notion-sdk-ts';

let found = false;

for await (const page of paginateIterator((cursor) =>
  notion.databases.query('database-id', { start_cursor: cursor }),
)) {
  if (page.getTitle() === 'Target Page') {
    console.log('Found target page:', page.id);
    found = true;
    break; // Stop pagination
  }
}

if (!found) {
  console.log('Target page not found');
}
```

### Pagination with Rate Limit Awareness

Add delays between pages to respect rate limits:

```typescript
async function paginateWithDelay<T>(
  fetcher: (cursor?: string) => Promise<PaginatedList<T>>,
  delayMs: number = 100,
): Promise<T[]> {
  const allResults: T[] = [];
  let cursor: string | null | undefined = undefined;

  do {
    const response = await fetcher(cursor);
    allResults.push(...response.results);
    cursor = response.next_cursor;

    if (cursor && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  } while (cursor);

  return allResults;
}

// Usage
const blocks = await paginateWithDelay(
  (cursor) => notion.blocks.children.list('page-id', { start_cursor: cursor }),
  200, // 200ms delay between pages
);
```

### Counting Without Fetching All Data

Count all results without fetching all the data:

```typescript
async function countResults<T>(
  fetcher: (cursor?: string) => Promise<PaginatedList<T>>,
): Promise<number> {
  let count = 0;
  let cursor: string | null | undefined = undefined;

  do {
    const response = await fetcher(cursor);
    count += response.results.length;
    cursor = response.next_cursor;
  } while (cursor);

  return count;
}

// Usage
const taskCount = await countResults((cursor) =>
  notion.databases.query('database-id', {
    start_cursor: cursor,
    filter: filter.status('Status').equals('To Do'),
  }),
);

console.log(`${taskCount} tasks to do`);
```

---

## Performance Tips

1. **Use `page_size: 100`.** This setting reduces the number of API calls. Default values vary
   by endpoint.
2. **Use `paginateIterator()`.** This helper saves memory for large datasets.
3. **Add delays between requests.** Use this technique if you hit rate limits.
4. **Filter early.** Apply filters in the query instead of after you fetch the results.
5. **Stop early.** Break out of the iteration as soon as you find what you need.

---

## Related Pages

- **[API Reference](/api/)**: details on paginated endpoints.
- **[Common Use Cases](/guides/common-use-cases/)**: pagination examples in practice.
- **[Error Handling](/guides/error-handling/)**: how to handle pagination errors.
- **[Configuration](/guides/configuration/)**: rate limiting configuration.
