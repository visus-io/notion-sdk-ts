---
title: Models
description: Page, Block, Database, DataSource, User, Comment, FileUpload, and other model classes.
sidebar:
  order: 2
---

All API methods return model instances with typed properties and helper methods. Every model validates raw API data through its Zod schema on construction.

## Table of Contents

- [Page](#page)
- [Block](#block)
- [Database](#database)
- [DataSource](#datasource)
- [User](#user)
- [Comment](#comment)
- [FileUpload](#fileupload)
- [AsyncTask](#asynctask)
- [CustomEmoji](#customemoji)
- [View](#view)
- [RichText Utility](#richtext-utility)

---

## Page

The `Page` model represents a Notion page.

### Properties

```typescript
const page = await notion.pages.retrieve('page-id');

page.id; // UUID
page.url; // Notion URL
page.publicUrl; // Public URL (if shared)
page.createdTime; // Date
page.lastEditedTime; // Date
page.inTrash; // boolean
page.isArchived; // boolean
page.isLocked; // boolean
page.properties; // Record of property values
page.parent; // Parent reference
page.icon; // Icon object (if set)
page.cover; // Cover object (if set)
```

> **Note:** There is no `page.archived` getter. Use `page.inTrash` to check trash status instead.
> `isArchived` is a separate, independent flag. It is distinct from trash status.

### Methods

```typescript
// Get page title as plain text
page.getTitle(); // "My Page Title"

// Get specific property value
page.getProperty('Name');
page.getProperty('Status');

// Check parent type
page.isInDatabase(); // true if parent is a database
page.isSubpage(); // true if parent is a page

// Get raw validated data
page.toJSON();
```

### Example Usage

```typescript
const page = await notion.pages.retrieve('page-id');

console.log(`Title: ${page.getTitle()}`);
console.log(`URL: ${page.url}`);
console.log(`Created: ${page.createdTime}`);
console.log(`In trash: ${page.inTrash}`);

if (page.isInDatabase()) {
  console.log('This page is in a database');
}

// Access properties
if (page.properties.Status?.type === 'status') {
  console.log(`Status: ${page.properties.Status.status?.name}`);
}
```

---

## Block

The `Block` model represents any Notion block. The schema has 35 block types. See
[Helpers](/guides/helpers/#block-builder) for the block types that have a dedicated factory
function.

### Properties

```typescript
const block = await notion.blocks.retrieve('block-id');

block.id; // UUID
block.type; // 'paragraph' | 'heading_1' | 'heading_2' | ...
block.hasChildren; // boolean
block.createdTime; // Date
block.lastEditedTime; // Date
block.inTrash; // boolean
```

### Methods

```typescript
// Type guards
block.isTextBlock(); // paragraph, heading, list item, and more
block.isHeading(); // heading_1, heading_2, heading_3, heading_4
block.canHaveChildren(); // toggle, column, synced_block, tab, table, and more

// Extract text content
block.getPlainText(); // Extract all text from the block

// Get raw validated data
block.toJSON();
```

### Example Usage

```typescript
const blocks = await notion.blocks.children.list('page-id');

for (const block of blocks.results) {
  console.log(`Type: ${block.type}`);

  if (block.isTextBlock()) {
    console.log(`Text: ${block.getPlainText()}`);
  }

  if (block.isHeading()) {
    console.log('This is a heading block');
  }

  if (block.hasChildren) {
    console.log('This block has children');
  }
}
```

### Accessing Block Content

```typescript
const block = await notion.blocks.retrieve('block-id');

// Paragraph block
if (block.type === 'paragraph') {
  console.log(block.paragraph.rich_text);
  console.log(block.paragraph.color);
}

// Heading block
if (block.type === 'heading_1') {
  console.log(block.heading_1.rich_text);
  console.log(block.heading_1.is_toggleable);
}

// Code block
if (block.type === 'code') {
  console.log(block.code.rich_text);
  console.log(block.code.language);
  console.log(block.code.caption);
}

// Image block
if (block.type === 'image') {
  if (block.image.type === 'external') {
    console.log(block.image.external.url);
  } else if (block.image.type === 'file') {
    console.log(block.image.file.url);
  }
}
```

---

## Database

The `Database` model represents a Notion database.

### Properties

```typescript
const db = await notion.databases.retrieve('database-id');

db.id; // UUID
db.title; // NotionRichText
db.description; // NotionRichText
db.dataSources; // DataSourceRef[]
db.url; // Notion URL
db.publicUrl; // Public URL (if shared)
db.isInline; // boolean
db.parent; // Parent reference
db.icon; // Icon object (if set)
db.cover; // Cover object (if set)
db.createdTime; // Date
db.lastEditedTime; // Date
db.inTrash; // boolean
db.isLocked; // boolean
```

> **Note:** There is no `db.archived` getter. Use `db.inTrash` to check trash status instead.

### Methods

```typescript
// Get title and description as plain text
db.getTitle(); // "My Database"
db.getDescription(); // "Database description"

// Check database type
db.isFullPage(); // true if not inline

// Check parent type
db.hasPageParent();
db.hasWorkspaceParent();

// Get raw validated data
db.toJSON();
```

### Example Usage

```typescript
const db = await notion.databases.retrieve('database-id');

console.log(`Title: ${db.getTitle()}`);
console.log(`URL: ${db.url}`);
console.log(`Is inline: ${db.isInline}`);
console.log(`Data sources: ${db.dataSources.length}`);

// Access first data source
const dataSourceId = db.dataSources[0].id;
const dataSourceName = db.dataSources[0].name;

console.log(`Primary data source: ${dataSourceName} (${dataSourceId})`);
```

---

## DataSource

The `DataSource` model represents a database data source. This model was added in API version
2025-09-03.

### Properties

```typescript
const ds = await notion.dataSources.retrieve('data-source-id');

ds.id; // UUID
ds.name; // string
ds.description; // string | undefined
ds.properties; // Property configurations
ds.parent; // Parent database reference
ds.createdTime; // Date
ds.lastEditedTime; // Date
ds.inTrash; // boolean
```

> **Note:** There is no `ds.archived` getter. Use `ds.inTrash` to check trash status instead.

### Methods

```typescript
// Get name and description
ds.getTitle(); // Same as ds.name
ds.getDescription(); // Description or empty string

// Get parent database ID
ds.getParentDatabaseId(); // Database ID

// Property methods
ds.getProperty('Name'); // Get specific property config
ds.getPropertyNames(); // Get all property names
ds.hasProperty('Status'); // Check if property exists

// Get raw validated data
ds.toJSON();
```

### Example Usage

```typescript
const db = await notion.databases.retrieve('database-id');
const dataSourceId = db.dataSources[0].id;

const ds = await notion.dataSources.retrieve(dataSourceId);

console.log(`Name: ${ds.getTitle()}`);
console.log(`Properties: ${ds.getPropertyNames().join(', ')}`);

// Check for specific property
if (ds.hasProperty('Status')) {
  const statusProp = ds.getProperty('Status');
  console.log('Status property exists:', statusProp);
}

// Update data source properties
await notion.dataSources.update(dataSourceId, {
  properties: {
    'New Field': { number: {} },
  },
});
```

---

## User

The `User` model represents a Notion user. A user is either a person or a bot.

### Properties

```typescript
const user = await notion.users.retrieve('user-id');

user.id; // UUID
user.type; // 'person' | 'bot' | undefined
user.name; // string | undefined
user.avatarUrl; // string | undefined
```

### Methods

```typescript
// Type guards
user.isPerson(); // true if type === 'person'
user.isBot(); // true if type === 'bot'

// Person-specific
user.getEmail(); // Email (person users only)

// Bot-specific
user.getBotInfo(); // Bot workspace info

// Get raw validated data
user.toJSON();
```

### Example Usage

```typescript
const user = await notion.users.retrieve('user-id');

console.log(`Name: ${user.name}`);
console.log(`Avatar: ${user.avatarUrl}`);

if (user.isPerson()) {
  console.log(`Email: ${user.getEmail()}`);
} else if (user.isBot()) {
  const botInfo = user.getBotInfo();
  console.log(`Bot workspace: ${botInfo?.workspace_name}`);
}

// List all users
const users = await notion.users.list();
for (const u of users.results) {
  console.log(`${u.name} (${u.type})`);
}
```

---

## Comment

The `Comment` model represents a comment on a page or block.

### Properties

```typescript
const comments = await notion.comments.list('page-id');
const comment = comments.results[0];

comment.id; // UUID
comment.discussionId; // UUID
comment.richText; // NotionRichText
comment.createdTime; // Date
comment.createdBy; // User reference
comment.parent; // Parent reference
comment.attachments; // File attachments
comment.displayName; // Custom display name (if set)
```

### Methods

```typescript
// Get comment text
comment.getPlainText(); // Plain text content

// Get display name (custom or from user)
comment.getDisplayName(); // Resolved display name

// Check for attachments and custom name
comment.hasAttachments();
comment.hasCustomDisplayName();

// Check parent type
comment.hasPageParent();
comment.hasBlockParent();

// Get raw validated data
comment.toJSON();
```

### Example Usage

```typescript
const comments = await notion.comments.list('page-id');

for (const comment of comments.results) {
  console.log(`${comment.getDisplayName()}: ${comment.getPlainText()}`);
  console.log(`Created: ${comment.createdTime}`);

  if (comment.hasAttachments()) {
    console.log(`Attachments: ${comment.attachments?.length}`);
  }
}

// Create a comment
await notion.comments.create({
  parent: { page_id: 'page-id' },
  rich_text: [{ type: 'text', text: { content: 'Great work!' } }],
});
```

---

## FileUpload

The `FileUpload` model represents an uploaded file.

### Properties

```typescript
const upload = await notion.fileUploads.retrieve('upload-id');

upload.id; // UUID
upload.status; // 'pending' | 'uploaded' | 'expired' | 'failed'
upload.filename; // string
upload.contentType; // MIME type
upload.contentLength; // number (bytes)
upload.uploadUrl; // Upload endpoint
upload.completeUrl; // Completion endpoint
```

### Methods

```typescript
// Status checks
upload.isPending(); // status === 'pending'
upload.isUploaded(); // status === 'uploaded'
upload.isExpired(); // status === 'expired'
upload.isFailed(); // status === 'failed'

// Get raw validated data
upload.toJSON();
```

### Example Usage

```typescript
import { readFileSync } from 'fs';

// One-step upload
const upload = await notion.fileUploads.uploadFile(
  'document.pdf',
  readFileSync('./document.pdf'),
  'application/pdf',
);

console.log(`Upload status: ${upload.status}`);
console.log(`File ID: ${upload.id}`);

if (upload.isUploaded()) {
  // Use the file in a page
  await notion.blocks.children.append('page-id', {
    children: [
      {
        type: 'pdf',
        pdf: { type: 'file_upload', file_upload: { id: upload.id } },
      },
    ],
  });
}

// Check upload status later
const status = await notion.fileUploads.retrieve(upload.id);
console.log(`Current status: ${status.status}`);
```

---

## AsyncTask

The `AsyncTask` model represents a long-running operation, for example an async markdown write.
You must poll this operation until it reaches a terminal status.

### Properties

```typescript
const task = await notion.asyncTasks.retrieve('task-id');

task.id; // string
task.status; // 'queued' | 'running' | 'retrying' | 'succeeded' | 'failed'
task.statusUrl; // URL that can be polled for status
task.createdTime; // Date
task.operation; // { surface: 'rest' | 'mcp', name: string }
task.pollAfterSeconds; // number | undefined: minimum seconds to wait before polling again
task.result; // unknown: present only when status === 'succeeded'
task.error; // present only when status === 'failed'
```

### Methods

```typescript
task.isSucceeded(); // status === 'succeeded'
task.isFailed(); // status === 'failed'
task.isTerminal(); // isSucceeded() || isFailed()
```

### Example Usage

```typescript
const task = await notion.asyncTasks.poll('task-id', { timeoutMs: 60_000 });

if (task.isSucceeded()) {
  console.log(task.result);
} else if (task.isFailed()) {
  console.error(task.error);
}
```

---

## CustomEmoji

The `CustomEmoji` model represents a custom emoji available in the workspace.

### Properties

```typescript
const emojis = await notion.customEmojis.list();
const emoji = emojis.results[0];

emoji.id; // string
emoji.name; // string
emoji.url; // string: the emoji's image URL
```

### Example Usage

```typescript
const emojis = await notion.customEmojis.list({ name: 'party-parrot' });

for (const emoji of emojis.results) {
  console.log(`${emoji.name}: ${emoji.url}`);
}
```

Reference a custom emoji as an icon with the [`icon.customEmoji(id)`](/guides/helpers/#icon-helpers) helper.

---

## View

The `View` model represents how a database or data source displays its rows. Examples: table,
board, and calendar.

### Properties

```typescript
const view = await notion.views.retrieve('view-id');

view.id; // string
view.parent; // Parent reference
view.dataSourceId; // string | null: null for dashboard views
view.name; // string
view.type; // 'table' | 'board' | 'list' | 'calendar' | 'timeline' | 'gallery' | 'form' | 'chart' | 'map' | 'dashboard'
view.filter; // Record<string, unknown> | null | undefined
view.sorts; // Record<string, unknown>[] | null | undefined
view.quickFilters; // Record<string, unknown> | null | undefined
view.configuration; // Per-layout configuration, if any
view.createdTime; // Date
view.lastEditedTime; // Date
view.createdBy; // User reference
view.lastEditedBy; // User reference
view.url; // Notion URL
view.dashboardViewId; // string | undefined: set if this view is a dashboard widget
```

### Methods

```typescript
view.isWidgetView(); // true if this view is a widget embedded in a dashboard
```

### Example Usage

```typescript
const views = await notion.views.list({ data_source_id: 'data-source-id' });

for (const view of views.results) {
  console.log(`${view.name} (${view.type})`);
}

const query = await notion.views.queries.create('view-id', {
  filter: { property: 'Status', status: { equals: 'Done' } },
});

for (const page of query.results) {
  console.log(page.getTitle());
}
```

---

## RichText Utility

The `RichText` utility class parses and converts Notion rich text to other formats.

### Constructor

```typescript
import { RichText } from '@visus-io/notion-sdk-ts';

const rt = new RichText(page.properties.Name.title);
```

### Methods

```typescript
// Convert to different formats
rt.toPlainText(); // "Project Documentation"
rt.toMarkdown(); // "**Project** Documentation"
rt.toHTML(); // "<strong>Project</strong> Documentation"

// Link detection
rt.hasLinks(); // boolean
rt.getLinks(); // string[] of all URLs

// Get raw data
rt.toJSON(); // Raw NotionRichText
```

### Supported Conversions

| Format   | Bold       | Italic   | Strikethrough | Underline | Code         | Link          |
| -------- | ---------- | -------- | ------------- | --------- | ------------ | ------------- |
| Markdown | `**text**` | `*text*` | `~~text~~`    | --        | `` `text` `` | `[text](url)` |
| HTML     | `<strong>` | `<em>`   | `<s>`         | `<u>`     | `<code>`     | `<a href="">` |

### Example Usage

```typescript
const page = await notion.pages.retrieve('page-id');
const titleRichText = page.properties.Name.title;

const rt = new RichText(titleRichText);

console.log('Plain text:', rt.toPlainText());
console.log('Markdown:', rt.toMarkdown());
console.log('HTML:', rt.toHTML());

if (rt.hasLinks()) {
  console.log('Links:', rt.getLinks());
}

// Use with any rich text property
const descriptionRt = new RichText(page.properties.Description.rich_text);
console.log(descriptionRt.toMarkdown());
```

### Working with Block Text

```typescript
const blocks = await notion.blocks.children.list('page-id');

for (const block of blocks.results) {
  if (block.type === 'paragraph') {
    const rt = new RichText(block.paragraph.rich_text);
    console.log('Plain:', rt.toPlainText());
    console.log('HTML:', rt.toHTML());
  }
}
```

---

## Related Pages

- **[Helpers](/guides/helpers/)**: how to create data with helper functions.
- **[API Reference](/api/)**: API methods that return models.
- **[TypeScript Support](/guides/typescript-support/)**: type definitions for models.
- **[Common Use Cases](/guides/common-use-cases/)**: practical examples that use models.
