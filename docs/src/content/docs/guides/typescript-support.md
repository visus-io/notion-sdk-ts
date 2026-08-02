---
title: TypeScript Support
description: Types, schemas, and type safety in the SDK.
sidebar:
  order: 8
---

The SDK gives full TypeScript support. It provides type definitions and Zod schemas for every
API response.

## Table of Contents

- [Exported Types](#exported-types)
- [Zod Schemas](#zod-schemas)
- [Model Classes](#model-classes)
- [Supported Block Types](#supported-block-types)
- [Supported Property Types](#supported-property-types)
- [Type Guards](#type-guards)
- [Manual Validation](#manual-validation)

---

## Exported Types

All Zod schemas export inferred TypeScript types:

```typescript
import type {
  // Core types
  NotionPage,
  NotionBlock,
  NotionDatabase,
  NotionDataSource,
  NotionUser,
  NotionComment,
  NotionFileUpload,
  NotionRichText,
  NotionAsyncTask,
  NotionCustomEmoji,
  NotionView,

  // Supporting types
  NotionParent,
  NotionFile,
  NotionColor,
  NotionIcon,
  NotionCover,
  BlockPosition,

  // Pagination
  PaginatedList,
  PaginationParameters,
} from '@visus-io/notion-sdk-ts';
```

### Using Types

```typescript
import type { NotionPage, NotionRichText } from '@visus-io/notion-sdk-ts';

function processPage(page: NotionPage) {
  console.log(page.id);
  console.log(page.url);
}

function formatRichText(richText: NotionRichText): string {
  return richText.map((rt) => rt.plain_text).join('');
}
```

---

## Zod Schemas

The SDK validates every API response with a Zod schema. Then it wraps the response in a model
class.

### Importing Schemas

```typescript
import {
  pageSchema,
  blockSchema,
  databaseSchema,
  dataSourceSchema,
  userSchema,
  commentSchema,
  fileUploadSchema,
  richTextSchema,
} from '@visus-io/notion-sdk-ts';
```

### Schema Usage

The SDK uses these schemas mainly for internal validation. It also exports them for advanced use
cases:

```typescript
import { pageSchema } from '@visus-io/notion-sdk-ts';

// Validate raw API data
const rawData = await fetch('https://api.notion.com/v1/pages/page-id');
const json = await rawData.json();

try {
  const validated = pageSchema.parse(json);
  console.log('Valid page:', validated);
} catch (error) {
  console.error('Validation failed:', error);
}
```

---

## Model Classes

Model classes provide typed interfaces with helper methods.

### Importing Model Types

```typescript
import type {
  Page,
  Block,
  Database,
  DataSource,
  User,
  Comment,
  FileUpload,
  RichText,
  AsyncTask,
  CustomEmoji,
  View,
} from '@visus-io/notion-sdk-ts';
```

### Using Model Types

```typescript
import type { Page, Block } from '@visus-io/notion-sdk-ts';

async function analyzePageStructure(pageId: string): Promise<void> {
  const page: Page = await notion.pages.retrieve(pageId);
  const blocks: Block[] = (await notion.blocks.children.list(pageId)).results;

  console.log(`Page: ${page.getTitle()}`);
  console.log(`Blocks: ${blocks.length}`);

  for (const block of blocks) {
    if (block.isTextBlock()) {
      console.log(`- ${block.type}: ${block.getPlainText()}`);
    }
  }
}
```

---

## Supported Block Types

The SDK supports all 35 Notion block types. Each type is fully type-safe:

### Block Type Union

```typescript
type BlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'heading_4'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'
  | 'quote'
  | 'callout'
  | 'code'
  | 'template'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'pdf'
  | 'bookmark'
  | 'embed'
  | 'child_database'
  | 'child_page'
  | 'column_list'
  | 'column'
  | 'tab'
  | 'divider'
  | 'table_of_contents'
  | 'breadcrumb'
  | 'table'
  | 'table_row'
  | 'link_preview'
  | 'synced_block'
  | 'equation'
  | 'meeting_notes'
  | 'unsupported';
```

### Type-Safe Block Access

```typescript
import type { NotionBlock } from '@visus-io/notion-sdk-ts';

function processBlock(block: NotionBlock) {
  // TypeScript knows the shape based on type
  if (block.type === 'paragraph') {
    console.log(block.paragraph.rich_text);
    console.log(block.paragraph.color);
  } else if (block.type === 'heading_1') {
    console.log(block.heading_1.rich_text);
    console.log(block.heading_1.is_toggleable);
  } else if (block.type === 'code') {
    console.log(block.code.rich_text);
    console.log(block.code.language);
    console.log(block.code.caption);
  } else if (block.type === 'image') {
    if (block.image.type === 'external') {
      console.log(block.image.external.url);
    } else if (block.image.type === 'file') {
      console.log(block.image.file.url);
      console.log(block.image.file.expiry_time);
    }
  }
}
```

---

## Supported Property Types

The SDK supports all 21 Notion property types:

### Property Type Union

```typescript
type PropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'select'
  | 'multi_select'
  | 'status'
  | 'relation'
  | 'rollup'
  | 'people'
  | 'created_by'
  | 'last_edited_by'
  | 'created_time'
  | 'last_edited_time'
  | 'files'
  | 'formula'
  | 'unique_id'
  | 'verification';
```

### Type-Safe Property Access

```typescript
import type { NotionPage } from '@visus-io/notion-sdk-ts';

function extractPageProperties(page: NotionPage) {
  // Title property
  if (page.properties.Name?.type === 'title') {
    console.log('Title:', page.properties.Name.title);
  }

  // Status property
  if (page.properties.Status?.type === 'status') {
    console.log('Status:', page.properties.Status.status?.name);
  }

  // Date property
  if (page.properties['Due Date']?.type === 'date') {
    console.log('Due:', page.properties['Due Date'].date?.start);
  }

  // Select property
  if (page.properties.Priority?.type === 'select') {
    console.log('Priority:', page.properties.Priority.select?.name);
  }

  // Multi-select property
  if (page.properties.Tags?.type === 'multi_select') {
    const tags = page.properties.Tags.multi_select.map((tag) => tag.name);
    console.log('Tags:', tags.join(', '));
  }

  // Relation property
  if (page.properties.Project?.type === 'relation') {
    const relatedIds = page.properties.Project.relation.map((rel) => rel.id);
    console.log('Related pages:', relatedIds);
  }

  // People property
  if (page.properties.Assignee?.type === 'people') {
    const assignees = page.properties.Assignee.people.map((person) => person.id);
    console.log('Assignees:', assignees);
  }
}
```

---

## Type Guards

Use type guards to narrow types:

### Model Type Guards

```typescript
import type { Block, User } from '@visus-io/notion-sdk-ts';

// Block type guards
function analyzeBlock(block: Block) {
  if (block.isTextBlock()) {
    console.log('Text content:', block.getPlainText());
  }

  if (block.isHeading()) {
    console.log('This is a heading');
  }

  if (block.canHaveChildren()) {
    console.log('This block can have children');
  }
}

// User type guards
function displayUser(user: User) {
  if (user.isPerson()) {
    console.log('Person email:', user.getEmail());
  } else if (user.isBot()) {
    console.log('Bot info:', user.getBotInfo());
  }
}
```

### Property Type Guards

```typescript
import type { NotionPage } from '@visus-io/notion-sdk-ts';

function getPropertyValue(page: NotionPage, propertyName: string): any {
  const property = page.properties[propertyName];

  if (!property) return null;

  switch (property.type) {
    case 'title':
      return property.title.map((rt) => rt.plain_text).join('');
    case 'rich_text':
      return property.rich_text.map((rt) => rt.plain_text).join('');
    case 'number':
      return property.number;
    case 'checkbox':
      return property.checkbox;
    case 'select':
      return property.select?.name;
    case 'multi_select':
      return property.multi_select.map((option) => option.name);
    case 'date':
      return property.date?.start;
    case 'url':
      return property.url;
    case 'email':
      return property.email;
    case 'phone_number':
      return property.phone_number;
    default:
      return null;
  }
}
```

---

## Manual Validation

Use Zod schemas to validate data manually:

### Validate API Responses

```typescript
import { pageSchema, blockSchema } from '@visus-io/notion-sdk-ts';
import { ZodError } from 'zod';

async function fetchAndValidatePage(pageId: string) {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': '2026-03-11',
    },
  });

  const data = await response.json();

  try {
    const validatedPage = pageSchema.parse(data);
    console.log('Valid page:', validatedPage);
    return validatedPage;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation errors:', error.errors);
    }
    throw error;
  }
}
```

### Partial Validation

```typescript
import { richTextSchema } from '@visus-io/notion-sdk-ts';

// Validate just rich text
const richTextData = [{ type: 'text', text: { content: 'Hello' }, plain_text: 'Hello' }];

const validated = richTextSchema.array().parse(richTextData);
console.log(validated);
```

---

## Advanced TypeScript Patterns

### Generic Helper Functions

```typescript
import type { PaginatedList } from '@visus-io/notion-sdk-ts';

async function getAllResults<T>(
  fetcher: (cursor?: string) => Promise<PaginatedList<T>>,
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null | undefined = undefined;

  do {
    const response = await fetcher(cursor);
    results.push(...response.results);
    cursor = response.next_cursor;
  } while (cursor);

  return results;
}

// Usage with type inference
const blocks = await getAllResults((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor }),
);
// blocks is Block[]

const pages = await getAllResults((cursor) =>
  notion.databases.query('database-id', { start_cursor: cursor }),
);
// pages is Page[]
```

### Type-Safe Property Builders

```typescript
import type { NotionPage } from '@visus-io/notion-sdk-ts';

type PageProperties = Record<string, any>;

function buildProperties(data: Record<string, any>): PageProperties {
  const properties: PageProperties = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      properties[key] = {
        rich_text: [{ type: 'text', text: { content: value } }],
      };
    } else if (typeof value === 'number') {
      properties[key] = { number: value };
    } else if (typeof value === 'boolean') {
      properties[key] = { checkbox: value };
    }
  }

  return properties;
}
```

---

## Related Pages

- **[Models](/guides/models/)**: details on model classes.
- **[Helpers](/guides/helpers/)**: type-safe helper functions.
- **[API Reference](/api/)**: API method signatures.
- **[ARCHITECTURE.md](https://github.com/visus-io/notion-sdk-ts/blob/main/ARCHITECTURE.md)**:
  project structure and types.
