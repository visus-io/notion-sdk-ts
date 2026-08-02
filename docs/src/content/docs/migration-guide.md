---
title: Migration Guide
description: Upgrade between Notion API versions supported by the SDK.
---

## Migration Guide: API Version 2026-03-11

**The SDK now uses Notion API version `2026-03-11`.** The previous version was `2025-09-03`. This
version has breaking changes in 3 areas: trash and archive behavior, the block children append
API, and one block type name. You can no longer override the API version.

Reference: [Notion Upgrade Guide: 2026-03-11](https://developers.notion.com/guides/get-started/upgrade-guide-2026-03-11)

### What Changed

#### 1. `archived` → `in_trash`

The API renames the `archived` field to `in_trash`. This rename applies to response payloads and
request bodies for pages, blocks, databases, and data sources. The SDK also renames the matching
model getter from `archived` to `inTrash`.

```typescript
// OLD (2025-09-03)
const page = await notion.pages.retrieve('page-id');
console.log(page.archived); // boolean

await notion.pages.update('page-id', { archived: true });

// NEW (2026-03-11)
const page = await notion.pages.retrieve('page-id');
console.log(page.inTrash); // boolean

await notion.pages.update('page-id', { in_trash: true });
```

The convenience methods `archive()` and `restore()` still work. Their signatures did not change.
`archive()` is now **deprecated**. Use `trash()` instead. See
[item 5 below](#5-archive--restore-→-trash--untrash-convenience-methods).

The same field rename applies to `blocks`, `databases`, and `dataSources`.

#### 2. `after` → `position` object (Append Block Children)

The SDK replaces the flat `after` string parameter on `blocks.children.append()` with a
structured `position` union:

| Old                         | New                                                                  |
| --------------------------- | -------------------------------------------------------------------- |
| `after: 'block-id'`         | `position: { type: 'after_block', after_block: { id: 'block-id' } }` |
| _(omitted: appends to end)_ | `position: { type: 'end' }` or omit `position`                       |
| _(not available)_           | `position: { type: 'start' }`                                        |

```typescript
// OLD (2025-09-03)
await notion.blocks.children.append('page-id', {
  children: [block.paragraph('New content')],
  after: 'existing-block-id',
});

// NEW (2026-03-11)
await notion.blocks.children.append('page-id', {
  children: [block.paragraph('New content')],
  position: { type: 'after_block', after_block: { id: 'existing-block-id' } },
});

// Insert at the start
await notion.blocks.children.append('page-id', {
  children: [block.paragraph('Prepended content')],
  position: { type: 'start' },
});

// Insert at the end (default: omitting position still works)
await notion.blocks.children.append('page-id', {
  children: [block.paragraph('Appended content')],
});
```

The package exports the `BlockPosition` type:

```typescript
import type { BlockPosition } from '@visus-io/notion-sdk-ts';
```

#### 3. `transcription` → `meeting_notes` block type

The API renames the `transcription` block type to `meeting_notes`.

```typescript
// OLD (2025-09-03)
import { block } from '@visus-io/notion-sdk-ts';
block.transcription({/* ... */});
// → { type: 'transcription', transcription: { ... } }

// NEW (2026-03-11)
block.meetingNotes({/* ... */});
// → { type: 'meeting_notes', meeting_notes: { ... } }
```

If your code checks `block.type` on block objects from the API, update the string literal:

```typescript
// OLD
if (block.type === 'transcription') { ... }

// NEW
if (block.type === 'meeting_notes') { ... }
```

> **`block.meetingNotes()` is now `@deprecated`.** Notion manages meeting notes blocks on the
> server. Notion sets their title, status, and child block IDs: summary, notes, and transcript. A
> client cannot build this structure by hand. The `rich_text`-based output of
> `block.meetingNotes()` no longer matches the real `meeting_notes` block shape. The SDK keeps
> this method only to avoid a sudden removal from the helper surface. To read meeting notes, use
> [`blocks.meetingNotes.query()`](/api/) or [`pages.getMarkdown({ include_transcript: true })`](/api/).
> Do not build meeting notes blocks in client code.

#### 4. `notionVersion` option removed, `NOTION_VERSION` constant added

The SDK removed the `notionVersion` option from `NotionClientOptions`. Code that passes this
option now fails to compile.

Instead, the SDK exports the target API version as a read-only constant:

```typescript
// OLD (2025-09-03): no longer valid
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  notionVersion: '2022-06-28', // ← compile error in 3.x
});

// NEW (2026-03-11)
import { NOTION_VERSION } from '@visus-io/notion-sdk-ts';
console.log(NOTION_VERSION); // '2026-03-11'

const notion = new Notion({ auth: process.env.NOTION_TOKEN }); // version is fixed
```

#### 5. `archive`/`restore` → `trash`/`untrash` convenience methods

The SDK renames the trash convenience methods on `pages`, `databases`, and `dataSources`. In
every module, `archive()` is now a deprecated wrapper around `trash()`. The "restore" side
differs by module. Check the list below for your module:

- **`pages`**:
  - `trash()`: new.
  - `restore()`: unchanged, not deprecated.
  - `archive()`: deprecated. It wraps `trash()`.
- **`databases`**:
  - `trash()`: new.
  - `restore()`: unchanged, not deprecated.
  - `archive()`: deprecated. It wraps `trash()`.
- **`dataSources`**:
  - `trash()`: new.
  - `untrash()`: new.
  - `archive()`: deprecated. It wraps `trash()`.
  - `restore()`: deprecated. It wraps `untrash()`.

```typescript
// OLD (still works, but deprecated)
await notion.pages.archive('page-id');
await notion.dataSources.archive('data-source-id');
await notion.dataSources.restore('data-source-id');

// NEW
await notion.pages.trash('page-id');
await notion.dataSources.trash('data-source-id');
await notion.dataSources.untrash('data-source-id');
```

### Migration Checklist (2025-09-03 → 2026-03-11)

- [ ] Replace `page.archived`, `block.archived`, `db.archived`, and `ds.archived` getter reads
      with `.inTrash`.
- [ ] Replace `{ archived: true }` or `{ archived: false }` in `update()` option objects with
      `{ in_trash: true }` or `{ in_trash: false }`.
- [ ] Replace `after: 'id'` in `blocks.children.append()` with
      `position: { type: 'after_block', after_block: { id: 'id' } }`.
- [ ] Replace `block.transcription(...)` helper calls with `block.meetingNotes(...)`.
- [ ] Replace `if (block.type === 'transcription')` checks with `'meeting_notes'`.
- [ ] Remove `notionVersion` from `NotionClientOptions` if your code has it. If you need to read
      the API version, use the `NOTION_VERSION` constant instead.
- [ ] Stop using `block.meetingNotes()` to build meeting notes content in client code. Read
      meeting notes with `blocks.meetingNotes.query()` or
      `pages.getMarkdown({ include_transcript: true })` instead.
- [ ] Replace `.archive()` and `.restore()` calls on `pages`, `databases`, and `dataSources` with
      `.trash()` and `.untrash()`. Note: `.restore()` keeps the same name on `pages` and
      `databases`.

---

## Migration Guide: API Version 2025-09-03

**This SDK now defaults to Notion API version `2025-09-03`.** The previous version was
`2022-06-28`. This version has breaking changes that support multi-source databases.

## Overview

API version `2025-09-03` restructures how databases work. This change supports multiple data
sources. The main changes affect:

- **Database creation**: properties move to `initial_data_source`.
- **Database updates**: use the Data Sources API instead.
- **Page creation**: requires both a data source ID and a database ID.
- **Search API**: returns `DataSource` objects instead of `Database` objects.

## What Changed

### 1. Database Creation

Specify properties under `initial_data_source.properties` instead of the top-level `properties`
field.

#### Old (2022-06-28)

```typescript
await notion.databases.create({
  parent: { page_id: 'page-id' },
  properties: {
    Name: { title: {} },
    Status: {
      select: {
        options: [
          { name: 'To Do', color: 'red' },
          { name: 'In Progress', color: 'yellow' },
          { name: 'Done', color: 'green' },
        ],
      },
    },
  },
});
```

#### New (2025-09-03)

```typescript
await notion.databases.create({
  parent: { page_id: 'page-id' },
  initial_data_source: {
    properties: {
      Name: { title: {} },
      Status: {
        select: {
          options: [
            { name: 'To Do', color: 'red' },
            { name: 'In Progress', color: 'yellow' },
            { name: 'Done', color: 'green' },
          ],
        },
      },
    },
  },
});
```

**Key change:** Wrap properties in the `initial_data_source` object.

### 2. Database Updates

The SDK removes the `properties` field from database update options. Use the Data Sources API
instead.

#### Old (2022-06-28)

```typescript
// Update properties directly on database
await notion.databases.update('db-id', {
  properties: { NewField: { number: {} } },
});
```

#### New (2025-09-03)

```typescript
// Step 1: Get the data source ID
const db = await notion.databases.retrieve('db-id');
const dataSourceId = db.dataSources[0].id;

// Step 2: Update properties on the data source
await notion.dataSources.update(dataSourceId, {
  properties: { NewField: { number: {} } },
});
```

**Key change:** Manage properties through the Data Sources API, not the Databases API.

### 3. Search API

When your filter targets databases, Search returns `DataSource` objects instead of `Database`
objects.

#### Old (2022-06-28)

```typescript
const results = await notion.search.query({
  filter: { property: 'object', value: 'database' },
});

// Results contain Database objects
for (const db of results.results) {
  console.log(db.title);
}
```

#### New (2025-09-03)

```typescript
const results = await notion.search.query({
  filter: { property: 'object', value: 'data_source' },
});

// Results contain DataSource objects
for (const ds of results.results) {
  console.log(ds.getTitle());
}
```

**Key changes:**

- The filter value changes from `'database'` to `'data_source'`.
- Results are `DataSource` objects, not `Database` objects.

### 4. Page Creation with Database Parent

Use `parent.dataSource(dataSourceId, databaseId)` instead of `parent.database(id)`.

#### Old (2022-06-28)

```typescript
import { parent, prop } from '@visus-io/notion-sdk-ts';

await notion.pages.create({
  parent: parent.database('database-id'),
  properties: {
    Name: prop.title('Task'),
    Status: prop.status('To Do'),
  },
});
```

#### New (2025-09-03)

```typescript
import { parent, prop } from '@visus-io/notion-sdk-ts';

// Step 1: Get the data source ID
const db = await notion.databases.retrieve('database-id');
const dataSourceId = db.dataSources[0].id;

// Step 2: Create page with both IDs
await notion.pages.create({
  parent: parent.dataSource(dataSourceId, db.id),
  properties: {
    Name: prop.title('Task'),
    Status: prop.status('To Do'),
  },
});
```

**Key change:** The SDK now requires both a data source ID and a database ID.

## How to Get Data Source IDs

Every database has at least 1 data source. Most databases have only 1 data source. In that case,
use the first data source.

```typescript
// Retrieve a database
const database = await notion.databases.retrieve('database-id');

// Get the first data source
const dataSourceId = database.dataSources[0].id;

// Or iterate through all data sources
database.dataSources.forEach((ds) => {
  console.log(`Data Source: ${ds.name} (${ds.id})`);
});
```

## Migration Checklist

Use this checklist to migrate your code:

- [ ] **Database Creation**
  - [ ] Wrap `properties` in `initial_data_source` object
  - [ ] Update parent to use `{ page_id }` or `{ workspace: true }`

- [ ] **Database Updates**
  - [ ] Replace `databases.update()` with `dataSources.update()` for property changes
  - [ ] Get data source ID before updating properties

- [ ] **Page Creation**
  - [ ] Get data source ID from database
  - [ ] Use `parent.dataSource(dataSourceId, databaseId)` instead of `parent.database(id)`

- [ ] **Search API**
  - [ ] Change filter value from `'database'` to `'data_source'`
  - [ ] Update result handling for `DataSource` objects

- [ ] **Database Queries**
  - [ ] No change needed. `databases.query()` still works the same way.

## Reverting to Old Version

SDK v3.x and later do not support version overrides. Each SDK version works with only 1 Notion
API version. See
[the 2026-03-11 migration section](#migration-guide-api-version-2026-03-11) for details. To use
the old API version `2022-06-28`, pin your package to `@visus-io/notion-sdk-ts@1.x`.

## Common Migration Patterns

### Pattern 1: Database Setup Function

#### Old

```typescript
async function createProjectDatabase(pageId: string) {
  return await notion.databases.create({
    parent: { page_id: pageId },
    title: [{ type: 'text', text: { content: 'Projects' } }],
    properties: {
      Name: { title: {} },
      Status: { status: {} },
      Priority: {
        select: {
          options: [/* ... */],
        },
      },
    },
  });
}
```

#### New

```typescript
async function createProjectDatabase(pageId: string) {
  return await notion.databases.create({
    parent: { page_id: pageId },
    title: [{ type: 'text', text: { content: 'Projects' } }],
    initial_data_source: {
      properties: {
        Name: { title: {} },
        Status: { status: {} },
        Priority: {
          select: {
            options: [/* ... */],
          },
        },
      },
    },
  });
}
```

### Pattern 2: Add Database Column Function

#### Old

```typescript
async function addColumn(databaseId: string, name: string, type: any) {
  return await notion.databases.update(databaseId, {
    properties: { [name]: type },
  });
}
```

#### New

```typescript
async function addColumn(databaseId: string, name: string, type: any) {
  // Get data source first
  const db = await notion.databases.retrieve(databaseId);
  const dataSourceId = db.dataSources[0].id;

  // Update data source
  return await notion.dataSources.update(dataSourceId, {
    properties: { [name]: type },
  });
}
```

### Pattern 3: Create Database Page Function

#### Old

```typescript
async function createTask(databaseId: string, title: string) {
  return await notion.pages.create({
    parent: parent.database(databaseId),
    properties: {
      Name: prop.title(title),
    },
  });
}
```

#### New

```typescript
async function createTask(databaseId: string, title: string) {
  // Get data source first
  const db = await notion.databases.retrieve(databaseId);
  const dataSourceId = db.dataSources[0].id;

  return await notion.pages.create({
    parent: parent.dataSource(dataSourceId, databaseId),
    properties: {
      Name: prop.title(title),
    },
  });
}
```

## More Information

For complete details about the API changes, see:

- [Official Notion API Upgrade Guide (2026-03-11)](https://developers.notion.com/guides/get-started/upgrade-guide-2026-03-11)
- [Official Notion API Upgrade Guide (2025-09-03)](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03)
- [Notion API Changelog](https://developers.notion.com/page/changelog)

## Need Help?

- Check [Common Use Cases](/guides/common-use-cases/) for updated examples
- Review the [API Reference](/api/) for detailed endpoint documentation
- See [Error Handling](/guides/error-handling/) for troubleshooting tips
