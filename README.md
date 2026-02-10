# @visus-io/notion-sdk-ts

[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/visus-io/notion-sdk-ts/ci.yml?style=for-the-badge&logo=github)](https://github.com/visus-io/notion-sdk-ts/actions/workflows/ci.yaml)

[![Sonar Quality Gate](https://img.shields.io/sonar/quality_gate/visus%3Anotion-sdk-ts?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonarcloud&logoColor=white)](https://sonarcloud.io/summary/overall?id=visus%3Anotion-sdk-ts)
[![Sonar Coverage](https://img.shields.io/sonar/coverage/visus%3Anotion-sdk-ts?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonarcloud&logoColor=white)](https://sonarcloud.io/summary/overall?id=visus%3Anotion-sdk-ts)

![NPM Version](https://img.shields.io/npm/v/%40visus-io%2Fnotion-sdk-ts?style=for-the-badge&logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/%40visus-io%2Fnotion-sdk-ts?style=for-the-badge&logo=npm)
![GitHub](https://img.shields.io/github/license/visus-io/notion-sdk-ts?style=for-the-badge)

A type-safe TypeScript SDK for the Notion API with Zod validation, OOP models, and ergonomic helpers.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Migration to API Version 2025-09-03](#migration-to-api-version-2025-09-03)
- [Quick Start](#quick-start)
- [Helpers](#helpers)
  - [Rich Text](#rich-text)
  - [Block Builder](#block-builder)
  - [Page Properties](#page-properties)
  - [Filters](#filters)
  - [Sorting](#sorting)
  - [Parent, Icon, Cover & File](#parent-icon-cover--file)
- [Models](#models)
- [Error Handling](#error-handling)
- [Request Size Limits](#request-size-limits)
- [Pagination](#pagination)
- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [Pages](#pages-api)
  - [Blocks](#blocks-api)
  - [Databases](#databases-api)
  - [Data Sources](#data-sources-api)
  - [Comments](#comments-api)
  - [Search](#search-api)
  - [Users](#users-api)
  - [File Uploads](#file-uploads-api)
- [TypeScript Support](#typescript-support)
- [Development](#development)
- [Project Structure](#project-structure)

## Features

- **Type-safe** Zod v4 runtime validation on every API response; full TypeScript declarations
- **Complete API coverage** Pages, Blocks, Databases, Data Sources, Comments, Search, Users, File Uploads
- **Ergonomic helpers** `block`, `richText`, `filter`, `sort`, `prop`, `parent`, `icon`, `cover`, `paginate` factories eliminate verbose JSON
- **OOP models** `Page`, `Block`, `Database`, `User`, `Comment`, `DataSource`, `FileUpload`, `RichText` with convenience methods
- **Automatic pagination** `paginate()` and `paginateIterator()` helpers automatically fetch all pages
- **Automatic rate limiting** Respects `Retry-After` header with exponential backoff fallback (configurable)
- **Client-side size validation** Enforces Notion API size limits before sending requests
- **Zero bloat** Single runtime dependency (`zod`); uses built-in `fetch` (Node 18+)

## Installation

```bash
npm install @visus-io/notion-sdk-ts
```

## Migration to API Version 2025-09-03

**This SDK now defaults to Notion API version `2025-09-03`** (previously `2022-06-28`). This version introduces breaking changes to support multi-source databases.

### What Changed

**Database Creation**

- Properties are now specified under `initial_data_source.properties` instead of top-level `properties`
- Parent can be `{ page_id: string }` or `{ workspace: true }` (data source parents removed)

```typescript
// ❌ Old (2022-06-28)
await notion.databases.create({
  parent: { page_id: 'page-id' },
  properties: {
    Name: { title: {} },
    Status: {
      select: {
        options: [
          /* ... */
        ],
      },
    },
  },
});

// ✅ New (2025-09-03)
await notion.databases.create({
  parent: { page_id: 'page-id' },
  initial_data_source: {
    properties: {
      Name: { title: {} },
      Status: {
        select: {
          options: [
            /* ... */
          ],
        },
      },
    },
  },
});
```

**Database Updates**

- `properties` field removed from update options (use Data Sources API instead)
- Added `is_inline` and `parent` fields for moving/configuring databases

```typescript
// ❌ Old (2022-06-28) - properties updated on database
await notion.databases.update('db-id', {
  properties: { NewField: { number: {} } },
});

// ✅ New (2025-09-03) - properties updated on data source
const db = await notion.databases.retrieve('db-id');
const dataSourceId = db.dataSources[0].id;
await notion.dataSources.update(dataSourceId, {
  properties: { NewField: { number: {} } },
});
```

**Search API**

- Search now returns `DataSource` objects instead of `Database` objects
- Filter value changed from `'database'` to `'data_source'`

```typescript
// ❌ Old (2022-06-28)
const results = await notion.search.query({
  filter: { property: 'object', value: 'database' },
});

// ✅ New (2025-09-03)
const results = await notion.search.query({
  filter: { property: 'object', value: 'data_source' },
});
```

**Page Creation with Database Parent**

- Use `parent.dataSource(dataSourceId, databaseId)` instead of `parent.database(id)` for creating pages
- Both data source ID and database ID are required

```typescript
// ❌ Old (2022-06-28)
await notion.pages.create({
  parent: parent.database('database-id'),
  properties: {
    /* ... */
  },
});

// ✅ New (2025-09-03) - recommended
const db = await notion.databases.retrieve('database-id');
const dataSourceId = db.dataSources[0].id;
await notion.pages.create({
  parent: parent.dataSource(dataSourceId, db.id),
  properties: {
    /* ... */
  },
});
```

### How to Get Data Source IDs

```typescript
// Retrieve database to get its data sources
const database = await notion.databases.retrieve('database-id');

// Get the first (and usually only) data source
const dataSourceId = database.dataSources[0].id;

// Or iterate through all data sources
database.dataSources.forEach((ds) => {
  console.log(`Data Source: ${ds.name} (${ds.id})`);
});
```

### Reverting to Old Version

If you need to stay on the old API version temporarily:

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  notionVersion: '2022-06-28', // Use old version
});
```

**Note:** The old version may not work correctly with databases that have multiple data sources. We recommend migrating to `2025-09-03` as soon as possible.

### More Information

For complete details, see the [official Notion API upgrade guide](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03).

## Quick Start

```typescript
import {
  Notion,
  block,
  richText,
  filter,
  sort,
  prop,
  parent,
  paginate,
} from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Retrieve a page
const page = await notion.pages.retrieve('page-id');
console.log(page.getTitle());

// Create a page in a database (2025-09-03 API)
const database = await notion.databases.retrieve('database-id');
const dataSourceId = database.dataSources[0].id;

await notion.pages.create({
  parent: parent.dataSource(dataSourceId, database.id),
  properties: {
    Name: prop.title('New Task'),
    Status: prop.status('In Progress'),
    Priority: prop.select('High'),
    'Due Date': prop.date('2025-03-01'),
  },
});

// Append blocks to a page
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

// Query a database with typed filters and sorts
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

// Search across workspace
const search = await notion.search.query({
  query: 'project planning',
  filter: { property: 'object', value: 'page' },
});
```

## Helpers

The SDK provides namespace objects that eliminate the verbose JSON the Notion API requires. All text-accepting helpers accept a `string`, a `RichTextBuilder`, or a raw `NotionRichText` array.

### Rich Text

Build formatted rich text with a chainable API:

```typescript
import { richText } from '@visus-io/notion-sdk-ts';

// Plain text
richText('Hello world').build();

// Chained formatting
richText('Important').bold().italic().color('red').build();

// Link
richText('Notion').link('https://notion.so').build();

// Combine multiple segments
richText.join(
  richText('Normal '),
  richText('bold').bold(),
  richText(' and '),
  richText('italic').italic(),
);

// Mentions
richText.mentionPage('page-id').build();
richText.mentionDatabase('db-id').build();
richText.mentionUser({ object: 'user', id: 'user-id' }).build();
richText.mentionDate('2025-03-01').build();
richText.mentionLinkPreview('https://example.com').build();

// Inline equation
richText.equation('E=mc^2').build();
```

### Block Builder

Factory functions for all 31 block types. Returns plain objects ready for `blocks.children.append()` or `pages.create()`:

```typescript
import { block, richText } from '@visus-io/notion-sdk-ts';

const children = [
  // Text blocks (accept string, RichTextBuilder, or NotionRichText)
  block.heading1('Title'),
  block.heading2('Subtitle', { isToggleable: true }),
  block.paragraph('Plain text'),
  block.paragraph(richText('Styled text').bold().color('blue')),
  block.bulletedListItem('First item'),
  block.numberedListItem('Step one'),
  block.toDo('Task', { checked: true }),
  block.toggle('Click to expand', { children: [block.paragraph('Hidden content')] }),
  block.quote('A wise saying'),
  block.callout('Heads up!', { icon: { type: 'emoji', emoji: '⚠️' } }),

  // Code & math
  block.code('const x = 42;', 'typescript', { caption: 'Example' }),
  block.equation('\\sum_{i=1}^{n} i'),

  // Media (accept URL string or FileSource object)
  block.image('https://example.com/photo.png', { caption: 'Photo' }),
  block.video('https://example.com/video.mp4'),
  block.audio('https://example.com/song.mp3'),
  block.file('https://example.com/doc.pdf'),
  block.pdf('https://example.com/doc.pdf'),

  // Embeds
  block.embed('https://twitter.com/example/status/123'),
  block.bookmark('https://example.com', { caption: 'Example site' }),
  block.linkPreview('https://github.com/example/repo'),

  // Structural
  block.divider(),
  block.breadcrumb(),
  block.tableOfContents(),
  block.table(3, {
    hasColumnHeader: true,
    children: [
      block.tableRow(['Name', 'Role', 'Status']),
      block.tableRow(['Alice', 'Engineer', 'Active']),
    ],
  }),
  block.columnList([[block.paragraph('Column 1')], [block.paragraph('Column 2')]]),

  // Synced blocks
  block.syncedBlock({ children: [block.paragraph('Original content')] }),
  block.syncedBlock({ syncedFrom: 'source-block-id' }),
];
```

### Page Properties

Factory functions for setting page property values when creating or updating pages:

```typescript
import { prop, richText } from '@visus-io/notion-sdk-ts';

const properties = {
  Name: prop.title('My Task'),
  Description: prop.richText('Some notes'),
  Notes: prop.richText(richText('Important').bold()),
  Score: prop.number(95),
  Done: prop.checkbox(true),
  Priority: prop.select('High'),
  Tags: prop.multiSelect(['urgent', 'frontend']),
  Status: prop.status('In Progress'),
  'Due Date': prop.date('2025-03-01'),
  'Date Range': prop.date('2025-03-01', { end: '2025-03-15' }),
  Website: prop.url('https://example.com'),
  Contact: prop.email('user@example.com'),
  Phone: prop.phoneNumber('+1-555-0100'),
  Related: prop.relation(['page-id-1', 'page-id-2']),
  Assignee: prop.people(['user-id']),
  Attachments: prop.files([{ name: 'doc.pdf', url: 'https://example.com/doc.pdf' }]),
};

// Clear a property by passing null
prop.select(null);
prop.date(null);
prop.url(null);
```

### Filters

Chainable filter builders for database queries:

```typescript
import { filter } from '@visus-io/notion-sdk-ts';

// Single property filters
filter.status('Status').equals('Active');
filter.select('Priority').doesNotEqual('Low');
filter.number('Score').greaterThan(80);
filter.checkbox('Done').equals(false);
filter.date('Due Date').before('2025-06-01');
filter.date('Due Date').pastWeek();
filter.text('Description').contains('important');
filter.title('Name').startsWith('Project');
filter.url('Website').isNotEmpty();
filter.email('Contact').isNotEmpty();
filter.multiSelect('Tags').contains('urgent');
filter.people('Assignee').contains('user-id');
filter.relation('Project').contains('page-id');
filter.files('Attachments').isNotEmpty();

// Timestamp filters (no property name needed)
filter.createdTime().after('2025-01-01');
filter.lastEditedTime().pastMonth();

// Compound filters
filter.and(
  filter.status('Status').equals('Active'),
  filter.number('Score').greaterThan(80),
  filter.or(filter.date('Due Date').before('2025-06-01'), filter.date('Due Date').isEmpty()),
);
```

### Sorting

```typescript
import { sort } from '@visus-io/notion-sdk-ts';

const sorts = [
  sort.property('Priority').ascending(),
  sort.property('Due Date').descending(),
  sort.createdTime().descending(),
  sort.lastEditedTime().ascending(),
];
```

### Parent, Icon, Cover & File

```typescript
import { parent, icon, cover, notionFile } from '@visus-io/notion-sdk-ts';

// Parent objects
parent.page('page-id');
parent.dataSource('data-source-id', 'database-id'); // Note: both IDs required in 2025-09-03
parent.workspace();
parent.block('block-id'); // For comments on blocks

// Icons
icon.emoji('🚀');
icon.external('https://example.com/icon.png');
icon.fileUpload('upload-id');

// Covers
cover.external('https://example.com/banner.jpg');
cover.fileUpload('upload-id');

// File references
notionFile.external('https://example.com/doc.pdf');
notionFile.upload('upload-id');
```

## Models

All API methods return model instances with typed properties and helper methods. Every model validates raw API data through its Zod schema on construction.

### Page

```typescript
const page = await notion.pages.retrieve('page-id');

page.id; // UUID
page.url; // Notion URL
page.publicUrl; // Public URL (if shared)
page.createdTime; // Date
page.lastEditedTime; // Date
page.archived; // boolean
page.inTrash; // boolean
page.properties; // Record of property values

page.getTitle(); // Plain text title
page.getProperty('Name'); // Specific property value
page.isInDatabase(); // true if parent is a database
page.isSubpage(); // true if parent is a page
page.toJSON(); // Raw validated data
```

### Block

```typescript
const block = await notion.blocks.retrieve('block-id');

block.id; // UUID
block.type; // 'paragraph' | 'heading_1' | ...
block.hasChildren; // boolean

block.isTextBlock(); // paragraph, heading, list item, etc.
block.isHeading(); // heading_1, heading_2, heading_3
block.canHaveChildren(); // toggle, column, synced_block, etc.
block.getPlainText(); // Extracted text content
block.toJSON();
```

### Database

```typescript
const db = await notion.databases.retrieve('database-id');

db.id; // UUID
db.title; // NotionRichText
db.description; // NotionRichText
db.dataSources; // DataSourceRef[]
db.url; // Notion URL
db.isInline; // boolean

db.getTitle(); // Plain text title
db.getDescription(); // Plain text description
db.isFullPage(); // true if not inline
db.hasPageParent();
db.hasWorkspaceParent();
db.toJSON();
```

### DataSource

```typescript
const ds = await notion.dataSources.retrieve('data-source-id');

ds.id; // UUID
ds.properties; // Property configurations

ds.getTitle();
ds.getDescription();
ds.getParentDatabaseId();
ds.getProperty('Name'); // Specific property config
ds.getPropertyNames(); // All property names
ds.hasProperty('Status');
ds.toJSON();
```

### User

```typescript
const user = await notion.users.retrieve('user-id');

user.id; // UUID
user.type; // 'person' | 'bot' | undefined
user.name; // string | undefined
user.avatarUrl; // string | undefined

user.isPerson(); // Type guard
user.isBot(); // Type guard
user.getEmail(); // Person users only
user.getBotInfo(); // Bot users only
user.toJSON();
```

### Comment

```typescript
const comments = await notion.comments.list('page-id');
const comment = comments.results[0];

comment.id;
comment.discussionId;
comment.richText; // NotionRichText
comment.createdTime; // Date
comment.attachments;
comment.displayName;

comment.getPlainText();
comment.hasAttachments();
comment.hasCustomDisplayName();
comment.getDisplayName(); // Resolved display name string
comment.hasPageParent();
comment.hasBlockParent();
comment.toJSON();
```

### FileUpload

```typescript
const upload = await notion.fileUploads.retrieve('upload-id');

upload.id;
upload.status; // 'pending' | 'uploaded' | 'expired' | 'failed'
upload.filename;
upload.contentType;
upload.contentLength;
upload.uploadUrl;
upload.completeUrl;

upload.isPending();
upload.isUploaded();
upload.isExpired();
upload.isFailed();
upload.toJSON();
```

### RichText Utility

Parse and convert Notion rich text to other formats:

```typescript
import { RichText } from '@visus-io/notion-sdk-ts';

const rt = new RichText(page.properties.Name.title);

rt.toPlainText(); // "Project Documentation"
rt.toMarkdown(); // "**Project** Documentation"
rt.toHTML(); // "<strong>Project</strong> Documentation"
rt.hasLinks(); // boolean
rt.getLinks(); // string[]
rt.toJSON(); // Raw NotionRichText
```

**Supported conversions:**

| Format   | Bold       | Italic   | Strikethrough | Underline | Code         | Link          |
| -------- | ---------- | -------- | ------------- | --------- | ------------ | ------------- |
| Markdown | `**text**` | `*text*` | `~~text~~`    | --        | `` `text` `` | `[text](url)` |
| HTML     | `<strong>` | `<em>`   | `<s>`         | `<u>`     | `<code>`     | `<a href="">` |

## Error Handling

Four error classes cover all failure modes:

```typescript
import {
  NotionAPIError,
  NotionNetworkError,
  NotionRequestTimeoutError,
  NotionValidationError,
} from '@visus-io/notion-sdk-ts';

try {
  await notion.pages.retrieve('page-id');
} catch (error) {
  if (error instanceof NotionValidationError) {
    // Client-side size limit exceeded (thrown before the request is sent)
    console.error(error.message);
  } else if (error instanceof NotionAPIError) {
    // Structured API error with status code and error code
    console.error(error.status, error.code, error.message);

    error.isNotFound(); // 404
    error.isUnauthorized(); // 401
    error.isValidationError(); // 400
    error.isRateLimited(); // 429 (auto-retried by default)
    error.isServerError(); // 5xx
    error.isRetryable(); // rate limited OR server error
  } else if (error instanceof NotionNetworkError) {
    // DNS failure, connection refused, etc.
    console.error(error.message, error.cause);
  } else if (error instanceof NotionRequestTimeoutError) {
    // Request exceeded configured timeout
    console.error(error.message);
  }
}
```

**Error codes:** `invalid_json`, `invalid_request_url`, `invalid_request`, `validation_error`, `missing_version`, `unauthorized`, `restricted_resource`, `object_not_found`, `conflict_error`, `rate_limited`, `internal_server_error`, `service_unavailable`, `database_connection_unavailable`, `gateway_timeout`

## Request Size Limits

The SDK enforces [Notion API size limits](https://developers.notion.com/reference/request-limits#size-limits) client-side, throwing `NotionValidationError` before the request is sent. This applies at both layers: helpers validate when constructing objects, and API methods validate before sending.

| Limit                        | Value        | Where enforced                                                                                  |
| ---------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `text.content` length        | 2,000 chars  | `richText()`, `block.*()`, `prop.title()`, `prop.richText()`                                    |
| `text.link.url` length       | 2,000 chars  | `richText().link()`                                                                             |
| `equation.expression` length | 1,000 chars  | `richText.equation()`, `block.equation()`                                                       |
| Any URL property             | 2,000 chars  | `prop.url()`, `block.embed()`, `block.bookmark()`, `block.linkPreview()`, `block.image()`, etc. |
| Email property               | 200 chars    | `prop.email()`                                                                                  |
| Phone number property        | 200 chars    | `prop.phoneNumber()`                                                                            |
| Block/rich-text arrays       | 100 elements | `blocks.children.append()`, `pages.create()`, `comments.create()`, `databases.create/update()`  |
| Multi-select options         | 100 options  | `prop.multiSelect()`                                                                            |
| Relation pages               | 100 pages    | `prop.relation()`                                                                               |
| People users                 | 100 users    | `prop.people()`                                                                                 |
| Comment attachments          | 3 files      | `comments.create()`                                                                             |
| `filter_properties`          | 100 items    | `pages.retrieve()`, `databases.retrieve/query()`, `dataSources.retrieve/query()`                |

All limit constants are exported as `LIMITS` for reference:

```typescript
import { LIMITS } from '@visus-io/notion-sdk-ts';

console.log(LIMITS.RICH_TEXT_CONTENT); // 2000
console.log(LIMITS.URL); // 2000
console.log(LIMITS.EMAIL); // 200
console.log(LIMITS.ARRAY_ELEMENTS); // 100
```

## Pagination

All list endpoints return `PaginatedList<T>` with cursor-based pagination:

```typescript
interface PaginatedList<T> {
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
}
```

The SDK provides helper utilities to automatically collect all results:

### `paginate()` - Collect all results

Automatically fetches all pages and returns a single array:

```typescript
import { paginate } from '@visus-io/notion-sdk-ts';

// All blocks from a page
const blocks = await paginate((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor, page_size: 100 }),
);

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

### `paginateIterator()` - Memory-efficient iteration

Process results one at a time without loading everything into memory:

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
```

### `paginateWithMetadata()` - Get results with pagination stats

Useful for tracking API usage and performance:

```typescript
import { paginateWithMetadata } from '@visus-io/notion-sdk-ts';

const { items, pageCount, totalCount } = await paginateWithMetadata((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor }),
);

console.log(`Fetched ${totalCount} blocks across ${pageCount} API calls`);
```

**Paginated endpoints:** `blocks.children.list()`, `comments.list()`, `databases.query()`, `dataSources.query()`, `search.query()`, `users.list()`

## Configuration

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN, // Required

  // All optional:
  baseUrl: 'https://api.notion.com', // Default
  notionVersion: '2025-09-03', // Default (use '2022-06-28' for old version)
  timeoutMs: 60_000, // Default: 60s
  retryOnRateLimit: true, // Default: true
  maxRetries: 3, // Default: 3
  fetch: customFetch, // Custom fetch implementation
});
```

**Rate limiting:** The SDK automatically retries 429 responses using the server's `Retry-After` header when present, falling back to exponential backoff (1s, 2s, 4s, 8s... capped at 60s) otherwise. Disable with `retryOnRateLimit: false` or adjust with `maxRetries`.

## API Reference

### Pages API

| Method                         | Description                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `pages.retrieve(id, options?)` | Get a page. Options: `filter_properties` (max 100)                                                                       |
| `pages.create(options)`        | Create a page. Requires `parent` + `properties`. Optional: `icon`, `cover`, `children` (max 100), `template`, `position` |
| `pages.update(id, options)`    | Update properties, icon, cover, lock status, or archive state. Supports `erase_content`                                  |
| `pages.archive(id)`            | Archive a page                                                                                                           |
| `pages.restore(id)`            | Restore an archived page                                                                                                 |

### Blocks API

| Method                                | Description                                               |
| ------------------------------------- | --------------------------------------------------------- |
| `blocks.retrieve(id, options?)`       | Get a block                                               |
| `blocks.update(id, options)`          | Update block content                                      |
| `blocks.delete(id)`                   | Delete (archive) a block                                  |
| `blocks.children.list(id, params?)`   | List child blocks (paginated)                             |
| `blocks.children.append(id, options)` | Append child blocks (max 100). Optional: `after` block ID |

### Databases API

| Method                             | Description                                                             |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `databases.retrieve(id, options?)` | Get a database                                                          |
| `databases.query(id, options?)`    | Query with `filter`, `sorts`, pagination. Returns `PaginatedList<Page>` |
| `databases.create(options)`        | Create a database. Requires `parent` + `properties`                     |
| `databases.update(id, options)`    | Update title, description, properties, icon, cover                      |
| `databases.archive(id)`            | Archive a database                                                      |
| `databases.restore(id)`            | Restore a database                                                      |

### Data Sources API

Data sources represent individual tables under databases (API version 2025-09-03).

| Method                                    | Description                                                          |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `dataSources.retrieve(id, options?)`      | Get a data source                                                    |
| `dataSources.query(id, options?)`         | Query with filters/sorts. `result_type`: `'page'` or `'data_source'` |
| `dataSources.create(options)`             | Create a data source under a database                                |
| `dataSources.update(id, options)`         | Update a data source                                                 |
| `dataSources.archive(id)` / `restore(id)` | Archive/restore                                                      |
| `dataSources.trash(id)` / `untrash(id)`   | Move to/from trash                                                   |

### Comments API

| Method                             | Description                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `comments.list(parentId, params?)` | List comments on a page/block (paginated)                                                                |
| `comments.create(options)`         | Create a comment. Options: `parent`, `rich_text`, `discussion_id`, `attachments` (max 3), `display_name` |

### Search API

| Method                   | Description                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `search.query(options?)` | Search workspace. Filter by `'page'` or `'database'`. Sort by `last_edited_time`. Returns `PaginatedList<Page \| Database>` |

### Users API

| Method                | Description                            |
| --------------------- | -------------------------------------- |
| `users.list(params?)` | List all workspace users (paginated)   |
| `users.retrieve(id)`  | Get a user by ID                       |
| `users.me()`          | Get the bot user for the current token |

### File Uploads API

| Method                                                | Description                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `fileUploads.uploadFile(filename, data, contentType)` | Upload a file in one call (handles initiate + upload + complete). `data`: `Buffer \| ArrayBuffer \| Blob` |
| `fileUploads.initiate(options)`                       | Step 1: Initiate upload                                                                                   |
| `fileUploads.upload(url, data, contentType)`          | Step 2: Upload file data                                                                                  |
| `fileUploads.complete(url)`                           | Step 3: Mark upload complete                                                                              |
| `fileUploads.retrieve(id)`                            | Check upload status                                                                                       |

**Full example:**

```typescript
import { readFileSync } from 'fs';

// One-step upload
const upload = await notion.fileUploads.uploadFile(
  'document.pdf',
  readFileSync('./document.pdf'),
  'application/pdf',
);

console.log(upload.status); // 'uploaded'

// Or multi-step for more control
const init = await notion.fileUploads.initiate({
  name: 'doc.pdf',
  content_type: 'application/pdf',
});
await notion.fileUploads.upload(init.uploadUrl, fileData, 'application/pdf');
const completed = await notion.fileUploads.complete(init.completeUrl);
```

## TypeScript Support

All Zod schemas and their inferred types are exported:

```typescript
import type {
  NotionPage,
  NotionBlock,
  NotionDatabase,
  NotionUser,
  NotionComment,
  NotionDataSource,
  NotionFileUpload,
  NotionRichText,
  NotionParent,
  NotionFile,
  NotionColor,
  PaginatedList,
} from '@visus-io/notion-sdk-ts';

// Model classes
import type {
  Page,
  Block,
  Database,
  User,
  Comment,
  DataSource,
  FileUpload,
} from '@visus-io/notion-sdk-ts';

// Zod schemas for manual validation
import { pageSchema, blockSchema, databaseSchema, userSchema } from '@visus-io/notion-sdk-ts';

const validated = pageSchema.parse(rawData);
```

**Supported block types (31):** paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, quote, callout, code, template, image, video, audio, file, pdf, bookmark, embed, child_database, child_page, column_list, column, divider, table_of_contents, breadcrumb, table, table_row, link_preview, synced_block, equation, unsupported

**Supported property types (21):** title, rich_text, number, checkbox, date, url, email, phone_number, select, multi_select, status, relation, rollup, people, created_by, last_edited_by, created_time, last_edited_time, files, formula, unique_id, verification

## Development

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript to dist/

npm test                 # Run tests (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (v8)

npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint issues
npm run format           # Prettier
npm run format:check     # Check formatting
```

## Project Structure

```
src/
├── index.ts                     # Entry point — re-exports everything
├── notion.ts                    # Notion class (main SDK entry)
├── client.ts                    # HTTP client with retry logic
├── errors.ts                    # NotionAPIError, NotionNetworkError, NotionRequestTimeoutError
├── validation.ts                # NotionValidationError, LIMITS, size-limit validators
├── api/
│   ├── blocks.api.ts            # Blocks API
│   ├── comments.api.ts          # Comments API
│   ├── databases.api.ts         # Databases API
│   ├── dataSources.api.ts       # Data Sources API
│   ├── fileUploads.api.ts       # File Uploads API
│   ├── pages.api.ts             # Pages API
│   ├── search.api.ts            # Search API
│   └── users.api.ts             # Users API
├── helpers/
│   ├── block.helpers.ts         # block.paragraph(), block.heading1(), etc.
│   ├── richText.helpers.ts      # richText(), RichTextBuilder
│   ├── filter.helpers.ts        # filter.status(), filter.and(), etc.
│   ├── sort.helpers.ts          # sort.property(), sort.createdTime()
│   ├── property.helpers.ts      # prop.title(), prop.select(), etc.
│   ├── parent.helpers.ts        # parent.dataSource(), parent.page(), parent.workspace()
│   └── file.helpers.ts          # icon, cover, notionFile
├── models/
│   ├── base.model.ts            # Abstract BaseModel<T> with Zod validation
│   ├── page.model.ts            # Page
│   ├── block.model.ts           # Block
│   ├── database.model.ts        # Database
│   ├── dataSource.model.ts      # DataSource
│   ├── comment.model.ts         # Comment
│   ├── user.model.ts            # User
│   ├── fileUpload.model.ts      # FileUpload
│   └── richText.model.ts        # RichText (toPlainText/toMarkdown/toHTML)
└── schemas/
    ├── page.schema.ts           # pageSchema + NotionPage
    ├── block.schema.ts          # blockSchema + NotionBlock (31 types)
    ├── database.schema.ts       # databaseSchema + NotionDatabase
    ├── dataSource.schema.ts     # dataSourceSchema + NotionDataSource
    ├── comment.schema.ts        # commentSchema + NotionComment
    ├── user.schema.ts           # userSchema + NotionUser
    ├── fileUpload.schema.ts     # fileUploadSchema + NotionFileUpload
    ├── pageProperties.schema.ts # 21 page property value types
    ├── propertyObjects.schema.ts# 21 database property config types
    ├── richText.schema.ts       # richTextSchema + 3 types + 6 mention types
    ├── pagination.schema.ts     # PaginatedList<T>, PaginationParameters
    ├── parent.schema.ts         # 5 parent types
    ├── file.schema.ts           # 3 file variants
    ├── emoji.schema.ts          # NotionEmoji
    ├── colors.ts                # NOTION_COLORS (19 colors)
    └── codeLanguages.ts         # CODE_BLOCK_LANGUAGES (75 languages)
```

**Architecture:** `Notion` (facade) -> `*API` classes (endpoint logic + Zod parsing) -> `NotionClient` (HTTP transport with retry). Every API response is validated through its Zod schema before being wrapped in a model class.

## Links

- [Notion API Documentation](https://developers.notion.com/reference/intro)
- [Notion API Changelog](https://developers.notion.com/page/changelog)
- [GitHub Repository](https://github.com/visus-io/notion-sdk-ts)
