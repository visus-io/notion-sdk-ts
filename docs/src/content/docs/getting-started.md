---
title: Getting Started
description: Install, configure, and make your first API call with @visus-io/notion-sdk-ts.
---

This guide shows the first steps for `@visus-io/notion-sdk-ts`. You install the SDK and send your
first API call in a few minutes.

## Installation

```bash
npm install @visus-io/notion-sdk-ts
```

**Requirements:**

- Node.js 18 or later. This version has the built-in `fetch` function.
- A Notion integration token. Create one at
  [My Integrations](https://www.notion.so/my-integrations).

## Quick Start

### 1. Initialize the Client

```typescript
import { Notion } from '@visus-io/notion-sdk-ts';

const notion = new Notion({
  auth: process.env.NOTION_TOKEN, // Your integration token
});
```

### 2. Retrieve a Page

```typescript
const page = await notion.pages.retrieve('page-id');
console.log(page.getTitle());
console.log(page.url);
```

### 3. Create a Page in a Database

API version `2026-03-11` requires a data source ID. Get the data source ID before you create the
page:

```typescript
import { prop, parent } from '@visus-io/notion-sdk-ts';

// Get the database and its data source
const database = await notion.databases.retrieve('database-id');
const dataSourceId = database.dataSources[0].id;

// Create a page
await notion.pages.create({
  parent: parent.dataSource(dataSourceId, database.id),
  properties: {
    Name: prop.title('New Task'),
    Status: prop.status('In Progress'),
    Priority: prop.select('High'),
    'Due Date': prop.date('2025-03-01'),
  },
});
```

### 4. Add Content to a Page

```typescript
import { block, richText } from '@visus-io/notion-sdk-ts';

await notion.blocks.children.append('page-id', {
  children: [
    block.heading2('Meeting Notes'),
    block.paragraph('Discussed the roadmap for Q2.'),
    block.paragraph(richText('Action item: ').build().concat(richText('ship v2').bold().build())),
    block.toDo('Follow up with design', { checked: false }),
    block.divider(),
    block.code('console.log("hello")', 'typescript'),
  ],
});
```

### 5. Query a Database

```typescript
import { filter, sort } from '@visus-io/notion-sdk-ts';

const results = await notion.databases.query('database-id', {
  filter: filter.and(
    filter.status('Status').equals('In Progress'),
    filter.select('Priority').equals('High'),
  ),
  sorts: [sort.property('Due Date').ascending()],
});

for (const page of results.results) {
  console.log(page.getTitle(), page.url);
}
```

### 6. Search Workspace

```typescript
const search = await notion.search.query({
  query: 'project planning',
  filter: { property: 'object', value: 'page' },
});

for (const result of search.results) {
  console.log(result.getTitle(), result.url);
}
```

## Basic Configuration

### Authentication

Set your Notion integration token:

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
});
```

### API Version

The SDK uses Notion API version `2026-03-11`. You cannot change this version. To find the version
in code, use the exported constant:

```typescript
import { NOTION_VERSION } from '@visus-io/notion-sdk-ts';
console.log(NOTION_VERSION); // '2026-03-11'
```

See the [Migration Guide](/migration-guide/) to upgrade from an earlier SDK version.

### Timeout Configuration

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  timeoutMs: 30_000, // 30 seconds (default: 60 seconds)
});
```

### Rate Limiting

The SDK handles rate limiting automatically. To turn this off, set `retryOnRateLimit` to `false`:

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  retryOnRateLimit: false, // Disable automatic retries
  maxRetries: 5, // Or adjust max retries (default: 3)
});
```

## Common Patterns

### Working with Rich Text

```typescript
import { richText } from '@visus-io/notion-sdk-ts';

// Simple text
richText('Hello world').build();

// Formatted text
richText('Important').bold().italic().color('red').build();

// With link
richText('Notion').link('https://notion.so').build();

// Combine multiple segments
richText.join(
  richText('Normal '),
  richText('bold').bold(),
  richText(' and '),
  richText('italic').italic(),
);
```

### Building Blocks

```typescript
import { block } from '@visus-io/notion-sdk-ts';

const content = [
  block.heading1('Title'),
  block.paragraph('Some text'),
  block.bulletedListItem('First item'),
  block.bulletedListItem('Second item'),
  block.divider(),
  block.callout('Important note!', { icon: { type: 'emoji', emoji: '⚠️' } }),
];

await notion.blocks.children.append('page-id', { children: content });
```

### Handling Pagination

```typescript
import { paginate } from '@visus-io/notion-sdk-ts';

// Get all blocks from a page
const allBlocks = await paginate((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor }),
);

console.log(`Total blocks: ${allBlocks.length}`);
```

### Error Handling

```typescript
import { NotionAPIError, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  await notion.pages.retrieve('page-id');
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof NotionAPIError) {
    console.error(`API error ${error.status}:`, error.message);

    if (error.isNotFound()) {
      console.error('Page not found');
    } else if (error.isUnauthorized()) {
      console.error('Invalid token or missing permissions');
    }
  }
}
```

## Next Steps

- **[Common Use Cases](/guides/common-use-cases/)**: practical examples and workflows.
- **[Helpers](/guides/helpers/)**: full details on helper functions.
- **[Models](/guides/models/)**: full details on model objects.
- **[API Reference](/api/)**: complete endpoint documentation.
- **[Migration Guide](/migration-guide/)**: how to upgrade to API version `2026-03-11`.
