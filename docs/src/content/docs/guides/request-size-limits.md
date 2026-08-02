---
title: Request Size Limits
description: Notion API size limits and client-side enforcement.
sidebar:
  order: 7
---

The SDK enforces
[Notion API size limits](https://developers.notion.com/reference/request-limits#size-limits) on
the client. It throws `NotionValidationError` before it sends a request.

## Overview

Validation happens at **2 layers**:

1. **Helpers**: validate when they construct objects. Examples: `richText()`, `block.*()`, and
   `prop.*()`.
2. **API methods**: validate before they send a request. Examples: `pages.create()` and
   `blocks.children.append()`.

This 2-layer check prevents unnecessary API calls. It also gives immediate feedback on invalid
data.

---

## Size Limits Table

| Limit                        | Value        | Where Enforced                                                                                                   |
| ---------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `text.content` length        | 2,000 chars  | `richText()`, `block.*()`, `prop.title()`, `prop.richText()`                                                     |
| `text.link.url` length       | 2,000 chars  | `richText().link()`                                                                                              |
| `equation.expression` length | 1,000 chars  | `richText.equation()`, `block.equation()`                                                                        |
| Any URL property             | 2,000 chars  | `prop.url()`, `block.embed()`, `block.bookmark()`, `block.linkPreview()`, `block.image()`, and other URL helpers |
| Email property               | 200 chars    | `prop.email()`                                                                                                   |
| Phone number property        | 200 chars    | `prop.phoneNumber()`                                                                                             |
| Block and rich text arrays   | 100 elements | `blocks.children.append()`, `pages.create()`, `comments.create()`, `databases.create()`, `databases.update()`    |
| Multi-select options         | 100 options  | `prop.multiSelect()`                                                                                             |
| Relation pages               | 100 pages    | `prop.relation()`                                                                                                |
| People users                 | 100 users    | `prop.people()`                                                                                                  |
| Comment attachments          | 3 files      | `comments.create()`                                                                                              |
| `filter_properties`          | 100 items    | `pages.retrieve()`, `databases.retrieve/query()`, `dataSources.retrieve/query()`                                 |

---

## LIMITS Constants

The SDK exports all limits for reference:

```typescript
import { LIMITS } from '@visus-io/notion-sdk-ts';

console.log(LIMITS.RICH_TEXT_CONTENT); // 2000
console.log(LIMITS.URL); // 2000
console.log(LIMITS.EMAIL); // 200
console.log(LIMITS.PHONE_NUMBER); // 200
console.log(LIMITS.EQUATION_EXPRESSION); // 1000
console.log(LIMITS.ARRAY_ELEMENTS); // 100
console.log(LIMITS.COMMENT_ATTACHMENTS); // 3
```

---

## Examples by Limit Type

### Text Content (2,000 chars)

```typescript
import { richText, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  // This will throw NotionValidationError
  const longText = 'a'.repeat(3000);
  richText(longText).build();
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error(error.message);
    // "Rich text content exceeds maximum length of 2000 characters"
  }
}

// Split long text into multiple segments
const longContent = 'very long text...'; // > 2000 chars
const chunks = [];
for (let i = 0; i < longContent.length; i += 2000) {
  chunks.push(block.paragraph(longContent.slice(i, i + 2000)));
}

await notion.blocks.children.append('page-id', { children: chunks });
```

### URLs (2,000 chars)

```typescript
import { prop, block, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  const veryLongUrl = 'https://example.com/' + 'a'.repeat(3000);

  // All of these will throw NotionValidationError
  prop.url(veryLongUrl);
  block.bookmark(veryLongUrl);
  block.embed(veryLongUrl);
  richText('link').link(veryLongUrl);
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error(error.message);
  }
}
```

### Equations (1,000 chars)

```typescript
import { richText, block, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  const longEquation = '\\sum_{i=1}^{n}' + 'x'.repeat(1100);

  // These will throw NotionValidationError
  richText.equation(longEquation);
  block.equation(longEquation);
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Equation too long:', error.message);
  }
}
```

### Email and Phone (200 chars)

```typescript
import { prop, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  // These will throw NotionValidationError
  prop.email('a'.repeat(201) + '@example.com');
  prop.phoneNumber('+1-' + '5'.repeat(200));
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error(error.message);
  }
}
```

### Block Arrays (100 elements)

```typescript
import { block, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  // This will throw NotionValidationError
  const tooManyBlocks = Array(150).fill(block.paragraph('text'));

  await notion.blocks.children.append('page-id', {
    children: tooManyBlocks,
  });
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Too many blocks:', error.message);
  }
}

// Solution: Split into batches
async function appendBlocksInBatches(pageId: string, blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 100) {
    const batch = blocks.slice(i, i + 100);
    await notion.blocks.children.append(pageId, { children: batch });
  }
}

const manyBlocks = Array(250).fill(block.paragraph('text'));
await appendBlocksInBatches('page-id', manyBlocks);
```

### Multi-Select Options (100)

```typescript
import { prop, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  // This will throw NotionValidationError
  const tooManyTags = Array(150).fill('tag');
  prop.multiSelect(tooManyTags);
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Too many tags:', error.message);
  }
}

// Limit to 100
const tags = Array(150).fill('tag').slice(0, 100);
prop.multiSelect(tags);
```

### Relations & People (100)

```typescript
import { prop, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  // These will throw NotionValidationError
  const tooManyPages = Array(150).fill('page-id');
  prop.relation(tooManyPages);

  const tooManyUsers = Array(150).fill('user-id');
  prop.people(tooManyUsers);
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error(error.message);
  }
}
```

### Comment Attachments (3 files)

```typescript
import { parent, richText, NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  // This will throw NotionValidationError
  await notion.comments.create({
    parent: parent.page('page-id'),
    rich_text: richText('With attachments').build(),
    attachments: [
      { name: 'file1.pdf', url: 'https://example.com/1.pdf' },
      { name: 'file2.pdf', url: 'https://example.com/2.pdf' },
      { name: 'file3.pdf', url: 'https://example.com/3.pdf' },
      { name: 'file4.pdf', url: 'https://example.com/4.pdf' }, // Too many!
    ],
  });
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Too many attachments:', error.message);
  }
}

// Maximum 3 attachments
await notion.comments.create({
  parent: parent.page('page-id'),
  rich_text: richText('With attachments').build(),
  attachments: [
    { name: 'file1.pdf', url: 'https://example.com/1.pdf' },
    { name: 'file2.pdf', url: 'https://example.com/2.pdf' },
    { name: 'file3.pdf', url: 'https://example.com/3.pdf' },
  ],
});
```

### Filter Properties (100 items)

```typescript
import { NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  // This will throw NotionValidationError
  const tooManyProperties = Array(150).fill('property-id');

  await notion.pages.retrieve('page-id', {
    filter_properties: tooManyProperties,
  });
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Too many filter properties:', error.message);
  }
}

// Limit to 100
const properties = Array(150).fill('property-id').slice(0, 100);
await notion.pages.retrieve('page-id', {
  filter_properties: properties,
});
```

---

## Handling Validation Errors

### Basic Error Handling

```typescript
import { NotionValidationError } from '@visus-io/notion-sdk-ts';

try {
  await notion.pages.create({
    parent: { page_id: 'parent-id' },
    properties: {/* ... */},
    children: tooManyBlocks,
  });
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Validation failed:', error.message);
    // Handle the validation error, for example by splitting or truncating the data
  } else {
    throw error; // Re-throw other errors
  }
}
```

### Validation Before Sending

```typescript
import { LIMITS } from '@visus-io/notion-sdk-ts';

function validateBeforeCreate(text: string, blocks: any[]) {
  if (text.length > LIMITS.RICH_TEXT_CONTENT) {
    throw new Error(`Text too long: ${text.length} > ${LIMITS.RICH_TEXT_CONTENT}`);
  }

  if (blocks.length > LIMITS.ARRAY_ELEMENTS) {
    throw new Error(`Too many blocks: ${blocks.length} > ${LIMITS.ARRAY_ELEMENTS}`);
  }

  return true;
}

// Use before making API calls
try {
  validateBeforeCreate(myText, myBlocks);
  await notion.pages.create({/* ... */});
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

---

## Workarounds and Best Practices

### Split Long Text

```typescript
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

const longText = 'very long content...'; // > 2000 chars
const chunks = splitIntoChunks(longText, 2000);

const blocks = chunks.map((chunk) => block.paragraph(chunk));
await notion.blocks.children.append('page-id', { children: blocks });
```

### Batch Large Arrays

```typescript
async function batchAppendBlocks(pageId: string, blocks: any[]) {
  const batchSize = 100;

  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    await notion.blocks.children.append(pageId, { children: batch });
    console.log(`Appended batch ${i / batchSize + 1}`);
  }
}

const manyBlocks = Array(300)
  .fill(null)
  .map((_, i) => block.paragraph(`Paragraph ${i + 1}`));

await batchAppendBlocks('page-id', manyBlocks);
```

### Truncate URLs

```typescript
function truncateUrl(url: string, maxLength: number = 2000): string {
  if (url.length <= maxLength) return url;

  // Truncate and add indicator
  return url.slice(0, maxLength - 3) + '...';
}

const longUrl = 'https://example.com/' + 'a'.repeat(3000);
const safeUrl = truncateUrl(longUrl);

await notion.pages.create({
  parent: { page_id: 'parent-id' },
  properties: {
    title: { title: [{ type: 'text', text: { content: 'Page' } }] },
    Website: prop.url(safeUrl),
  },
});
```

### Limit Array Sizes

```typescript
function limitArraySize<T>(arr: T[], max: number): T[] {
  return arr.slice(0, max);
}

const manyTags = ['tag1', 'tag2', /* ... */ 'tag150'];
const safeTags = limitArraySize(manyTags, 100);

await notion.pages.update('page-id', {
  properties: {
    Tags: prop.multiSelect(safeTags),
  },
});
```

---

## Related Pages

- **[Error Handling](/guides/error-handling/)**: how to handle `NotionValidationError`.
- **[Helpers](/guides/helpers/)**: helper functions that enforce limits.
- **[Common Use Cases](/guides/common-use-cases/)**: working with large datasets.
- **[Official Notion API Limits](https://developers.notion.com/reference/request-limits#size-limits)**:
  the complete reference.
