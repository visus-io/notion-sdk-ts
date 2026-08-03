---
title: Common Use Cases
description: Practical examples and workflows for common Notion API tasks.
sidebar:
  order: 1
---

This guide shows practical examples and workflows for common Notion SDK tasks.

## Table of Contents

- [Creating a Task Management Database](#creating-a-task-management-database)
- [Building a Documentation Page](#building-a-documentation-page)
- [Querying and Filtering Databases](#querying-and-filtering-databases)
- [Working with Rich Text](#working-with-rich-text)
- [Uploading Files and Images](#uploading-files-and-images)
- [Working with Markdown Content](#working-with-markdown-content)
- [Working with Views](#working-with-views)
- [Managing Custom Emoji](#managing-custom-emoji)
- [Managing Comments](#managing-comments)
- [Batch Operations](#batch-operations)
- [Pagination Patterns](#pagination-patterns)
- [Syncing Data Between Systems](#syncing-data-between-systems)

---

## Creating a Task Management Database

Create a complete task management database with properties. Then add tasks to it.

```typescript
import { Notion, parent, prop, filter, sort } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Step 1: Create the database
const database = await notion.databases.create({
  parent: { page_id: 'parent-page-id' },
  title: [{ type: 'text', text: { content: 'Task Manager' } }],
  initial_data_source: {
    properties: {
      Name: { title: {} },
      Status: {
        status: {
          options: [
            { name: 'To Do', color: 'red' },
            { name: 'In Progress', color: 'yellow' },
            { name: 'Done', color: 'green' },
          ],
        },
      },
      Priority: {
        select: {
          options: [
            { name: 'High', color: 'red' },
            { name: 'Medium', color: 'yellow' },
            { name: 'Low', color: 'gray' },
          ],
        },
      },
      'Due Date': { date: {} },
      Assignee: { people: {} },
      Tags: { multi_select: {} },
    },
  },
});

// Step 2: Get data source for creating pages
const dataSourceId = database.dataSources[0].id;

// Step 3: Add tasks
const tasks = [
  {
    name: 'Review pull requests',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2025-03-15',
  },
  {
    name: 'Update documentation',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2025-03-20',
  },
  {
    name: 'Fix bug #123',
    status: 'To Do',
    priority: 'High',
    dueDate: '2025-03-10',
  },
];

for (const task of tasks) {
  await notion.pages.create({
    parent: parent.dataSource(dataSourceId, database.id),
    properties: {
      Name: prop.title(task.name),
      Status: prop.status(task.status),
      Priority: prop.select(task.priority),
      'Due Date': prop.date(task.dueDate),
      Tags: prop.multiSelect(['work', 'important']),
    },
  });
}

// Step 4: Query high-priority tasks
const highPriorityTasks = await notion.databases.query(database.id, {
  filter: filter.and(
    filter.select('Priority').equals('High'),
    filter.status('Status').doesNotEqual('Done'),
  ),
  sorts: [sort.property('Due Date').ascending()],
});

console.log(`${highPriorityTasks.results.length} high-priority tasks found`);
for (const task of highPriorityTasks.results) {
  console.log(`- ${task.getTitle()}`);
}
```

---

## Building a Documentation Page

Create a rich documentation page with various block types.

```typescript
import { Notion, block, richText, icon, cover } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Step 1: Create the page with icon and cover
const page = await notion.pages.create({
  parent: { page_id: 'parent-page-id' },
  icon: icon.emoji('📚'),
  cover: cover.external('https://images.unsplash.com/photo-1516979187457-637abb4f9353'),
  properties: {
    title: {
      title: [{ type: 'text', text: { content: 'API Documentation' } }],
    },
  },
});

// Step 2: Add structured content
await notion.blocks.children.append(page.id, {
  children: [
    // Header with table of contents
    block.heading1('API Documentation'),
    block.tableOfContents(),
    block.divider(),

    // Introduction
    block.heading2('Introduction'),
    block.paragraph(
      richText('Welcome to the API documentation. This guide covers ')
        .build()
        .concat(richText('authentication').bold().build())
        .concat(richText(', ').build())
        .concat(richText('endpoints').bold().build())
        .concat(richText(', and ').build())
        .concat(richText('examples').bold().build())
        .concat(richText('.').build()),
    ),
    block.callout('This API requires authentication for all requests.', {
      icon: { type: 'emoji', emoji: '🔐' },
      color: 'yellow_background',
    }),

    // Authentication section
    block.heading2('Authentication', { isToggleable: true }),
    block.paragraph('All API requests require an API key in the Authorization header:'),
    block.code('Authorization: Bearer YOUR_API_KEY', 'bash'),

    // Endpoints section
    block.heading2('Endpoints'),

    block.heading3('GET /users'),
    block.paragraph('Retrieve a list of users.'),
    block.toggle('Example Request', {
      children: [
        block.code(
          `curl -X GET https://api.example.com/users \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
          'bash',
        ),
      ],
    }),
    block.toggle('Example Response', {
      children: [
        block.code(
          JSON.stringify(
            {
              users: [
                { id: '1', name: 'Alice', email: 'alice@example.com' },
                { id: '2', name: 'Bob', email: 'bob@example.com' },
              ],
            },
            null,
            2,
          ),
          'json',
        ),
      ],
    }),

    // Rate limits section
    block.heading2('Rate Limits'),
    block.bulletedListItem('100 requests per minute for authenticated users'),
    block.bulletedListItem('10 requests per minute for unauthenticated users'),
    block.bulletedListItem('Rate limit resets at the start of each minute'),

    // Table with HTTP status codes
    block.heading2('HTTP Status Codes'),
    block.table(3, {
      hasColumnHeader: true,
      children: [
        block.tableRow(['Code', 'Status', 'Description']),
        block.tableRow(['200', 'OK', 'Request succeeded']),
        block.tableRow(['401', 'Unauthorized', 'Invalid API key']),
        block.tableRow(['429', 'Too Many Requests', 'Rate limit exceeded']),
        block.tableRow(['500', 'Internal Server Error', 'Server error occurred']),
      ],
    }),

    // Support section with columns
    block.heading2('Support'),
    block.columnList([
      [block.heading3('Email'), block.paragraph('support@example.com')],
      [
        block.heading3('Documentation'),
        block.paragraph(richText('Full docs').link('https://docs.example.com')),
      ],
      [
        block.heading3('Status'),
        block.paragraph(richText('System status').link('https://status.example.com')),
      ],
    ]),
  ],
});

console.log(`Documentation page created: ${page.url}`);
```

---

## Querying and Filtering Databases

These examples show advanced database filtering and sorting.

```typescript
import { Notion, filter, sort, paginate } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });
const databaseId = 'your-database-id';

// Example 1: Filter by multiple conditions
const activeHighPriorityTasks = await notion.databases.query(databaseId, {
  filter: filter.and(
    filter.status('Status').equals('In Progress'),
    filter.select('Priority').equals('High'),
    filter.date('Due Date').nextWeek(),
  ),
  sorts: [sort.property('Due Date').ascending()],
});

// Example 2: Complex OR conditions
const urgentOrOverdueTasks = await notion.databases.query(databaseId, {
  filter: filter.or(
    filter.select('Priority').equals('High'),
    filter.date('Due Date').before('2025-03-01'),
    filter.checkbox('Urgent').equals(true),
  ),
});

// Example 3: Nested conditions
const complexFilter = await notion.databases.query(databaseId, {
  filter: filter.and(
    filter.status('Status').doesNotEqual('Done'),
    filter.or(filter.select('Priority').equals('High'), filter.date('Due Date').nextWeek()),
  ),
});

// Example 4: Text search
const tasksWithKeyword = await notion.databases.query(databaseId, {
  filter: filter.text('Description').contains('urgent'),
});

// Example 5: People and relation filters
const myAssignedTasks = await notion.databases.query(databaseId, {
  filter: filter.and(
    filter.people('Assignee').contains('user-id'),
    filter.relation('Project').contains('project-page-id'),
  ),
});

// Example 6: Empty and non-empty checks
const tasksWithoutDueDate = await notion.databases.query(databaseId, {
  filter: filter.date('Due Date').isEmpty(),
});

// Example 7: Timestamp filters
const recentlyEdited = await notion.databases.query(databaseId, {
  filter: filter.lastEditedTime().pastWeek(),
  sorts: [sort.lastEditedTime().descending()],
});

// Example 8: Get all results with pagination
const allTasks = await paginate((cursor) =>
  notion.databases.query(databaseId, {
    start_cursor: cursor,
    page_size: 100,
    filter: filter.status('Status').equals('In Progress'),
  }),
);

console.log(`Total tasks: ${allTasks.length}`);
```

---

## Working with Rich Text

These examples show advanced rich text formatting and manipulation.

```typescript
import { richText, RichText } from '@visus-io/notion-sdk-ts';
import type { NotionColor } from '@visus-io/notion-sdk-ts';

// Example 1: Complex formatted text
const formattedText = richText.join(
  richText('Important: ').bold().color('red'),
  richText('This is a ').italic(),
  richText('critical').bold().italic().underline(),
  richText(' update about the '),
  richText('production').code(),
  richText(' environment.'),
);

// Example 2: Text with multiple links
const linksText = richText.join(
  richText('Check out our '),
  richText('documentation').link('https://docs.example.com').bold(),
  richText(' and '),
  richText('API reference').link('https://api.example.com').bold(),
  richText('.'),
);

// Example 3: Mentions in text
const mentionText = richText.join(
  richText('Hey '),
  richText.mentionUser({ object: 'user', id: 'user-id' }),
  richText(', please review '),
  richText.mentionPage('page-id'),
  richText(' by '),
  richText.mentionDate('2025-03-15'),
  richText('.'),
);

// Example 4: Equations in text
const mathText = richText.join(
  richText('The formula for kinetic energy is '),
  richText.equation('E = \\frac{1}{2}mv^2'),
  richText(' where m is mass and v is velocity.'),
);

// Example 5: Parse existing rich text
const page = await notion.pages.retrieve('page-id');
const nameProperty = page.properties.Name;
const titleRichText = nameProperty.type === 'title' ? nameProperty.title : [];

const rt = new RichText(titleRichText);
console.log('Plain text:', rt.toPlainText());
console.log('Markdown:', rt.toMarkdown());
console.log('HTML:', rt.toHTML());

if (rt.hasLinks()) {
  console.log('Links found:', rt.getLinks());
}

// Example 6: Build dynamic rich text
function createStatusMessage(status: string, username: string): any[] {
  const colors: Record<string, NotionColor> = {
    success: 'green',
    warning: 'yellow',
    error: 'red',
  };

  return richText.join(
    richText(`[${status.toUpperCase()}]`)
      .bold()
      .color(colors[status] || 'default'),
    richText(` Task completed by ${username}`),
  );
}

const message = createStatusMessage('success', 'Alice');
```

---

## Uploading Files and Images

Upload files. Then use them in pages and databases.

```typescript
import { Notion, icon, cover, block, notionFile } from '@visus-io/notion-sdk-ts';
import { readFileSync } from 'fs';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Example 1: Upload an image and use as page cover
const imageUpload = await notion.fileUploads.uploadFile(
  'banner.jpg',
  readFileSync('./banner.jpg'),
  'image/jpeg',
);

const page = await notion.pages.create({
  parent: { page_id: 'parent-page-id' },
  cover: cover.fileUpload(imageUpload.id),
  properties: {
    title: {
      title: [{ type: 'text', text: { content: 'My Page' } }],
    },
  },
});

// Example 2: Upload a PDF and add to page
const pdfUpload = await notion.fileUploads.uploadFile(
  'document.pdf',
  readFileSync('./document.pdf'),
  'application/pdf',
);

await notion.blocks.children.append(page.id, {
  children: [block.heading2('Attached Document'), block.pdf(notionFile.upload(pdfUpload.id))],
});

// Example 3: Upload icon
const iconUpload = await notion.fileUploads.uploadFile(
  'logo.png',
  readFileSync('./logo.png'),
  'image/png',
);

await notion.pages.update(page.id, {
  icon: icon.fileUpload(iconUpload.id),
});

// Example 4: Multi-step upload with progress tracking
const fileData = readFileSync('./large-file.zip');

const initUpload = await notion.fileUploads.initiate({
  filename: 'large-file.zip',
  content_type: 'application/zip',
  content_length: fileData.byteLength,
});

console.log('Upload initiated:', initUpload.id);

await notion.fileUploads.upload(initUpload.uploadUrl, fileData, 'application/zip');

console.log('File uploaded, finalizing...');

const completed = await notion.fileUploads.complete(initUpload.completeUrl);
console.log('Upload status:', completed.status);

// Example 5: Check upload status
const status = await notion.fileUploads.retrieve(completed.id);
if (status.isUploaded()) {
  console.log('File ready to use!');
} else if (status.isFailed()) {
  console.error('Upload failed');
}
```

---

## Working with Markdown Content

`pages.create()` accepts a markdown string as an alternative to `properties`/`children`.
`pages.getMarkdown()` and `pages.updateMarkdown()` read and write that content directly, without
building a block tree by hand.

```typescript
import { Notion, parent } from '@visus-io/notion-sdk-ts';
import { readFileSync } from 'fs';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Example 1: Create a page from markdown instead of properties/children.
// `markdown` is mutually exclusive with `properties` and `children`.
const page = await notion.pages.create({
  parent: parent.page('parent-page-id'),
  markdown: [
    '# Release Notes',
    '',
    'This release adds **markdown-based** page authoring.',
    '',
    '- Faster to write than a block tree',
    '- Round-trips through `getMarkdown()`/`updateMarkdown()`',
  ].join('\n'),
});

// Example 2: Read a page's content back as markdown
const content = await notion.pages.getMarkdown(page.id);
console.log(content.markdown);

if (content.truncated) {
  console.log('Content was truncated; fetch the block tree for the full page.');
}

// Example 3: Find-and-replace an exact markdown substring
await notion.pages.updateMarkdown(page.id, {
  type: 'update_content',
  content_updates: [
    {
      old_str: '# Release Notes',
      new_str: '# Release Notes (v3.1.0)',
    },
  ],
});

// Example 4: Replace the entire page body
await notion.pages.updateMarkdown(page.id, {
  type: 'replace_content',
  new_str: '# Rewritten\n\nThis page was replaced in one call.',
  allow_deleting_content: true,
});

// Example 5: Large writes can process asynchronously. Discriminate the response
// by `object`, then poll the async task through `notion.asyncTasks`.
const largeMarkdown = readFileSync('./release-notes.md', 'utf8');
const result = await notion.pages.updateMarkdown(page.id, {
  type: 'replace_content',
  new_str: largeMarkdown,
  allow_deleting_content: true,
  allow_async: true,
});

if (result.object === 'async_task') {
  const task = await notion.asyncTasks.poll(result.id, { timeoutMs: 60_000 });
  if (task.isSucceeded()) {
    console.log('Markdown update finished:', task.result);
  } else if (task.isFailed()) {
    console.error('Markdown update failed:', task.error);
  }
} else {
  console.log('Markdown update applied synchronously:', result.markdown);
}
```

---

## Working with Views

Views control how a database or data source displays its rows: table, board, calendar, and
more. View queries are separate from `dataSources.query()` — they respect the view's own filter,
sort, and layout, and each query result expires about 15 minutes after creation.

```typescript
import { Notion } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });
const dataSourceId = 'your-data-source-id';

// Example 1: List the views for a data source
const views = await notion.views.list({ data_source_id: dataSourceId });
for (const view of views.results) {
  console.log(`${view.name} (${view.type})`);
}

// Example 2: Create a board view grouped by status
const boardView = await notion.views.create({
  data_source_id: dataSourceId,
  name: 'By Status',
  type: 'board',
});

// Example 3: Query a view's rows and check for the 10,000-result cap.
// See the Pagination guide for how request_status signals truncation.
const query = await notion.views.queries.create(boardView.id, {
  filter: { property: 'Status', status: { equals: 'In Progress' } },
});

console.log(`${query.totalCount} rows, query expires at ${query.expiresAt}`);
for (const page of query.results) {
  console.log(page.getTitle());
}

if (query.requestStatus?.incomplete_reason === 'query_result_limit_reached') {
  console.log('Query hit the 10,000-result cap; narrow the filter to see the rest.');
}

// Example 4: Clean up the query and the view
await notion.views.queries.delete(boardView.id, query.id);
await notion.views.delete(boardView.id);
```

---

## Managing Custom Emoji

List the custom emojis available in the workspace, then reuse one as a page or database icon.

```typescript
import { Notion, icon } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Example 1: List all custom emojis
const emojis = await notion.customEmojis.list();
for (const emoji of emojis.results) {
  console.log(`${emoji.name}: ${emoji.url}`);
}

// Example 2: Look up one emoji by exact name
const partyParrot = await notion.customEmojis.list({ name: 'party-parrot' });
const emojiId = partyParrot.results[0]?.id;

// Example 3: Use a custom emoji as a page icon
if (emojiId) {
  await notion.pages.update('page-id', {
    icon: icon.customEmoji(emojiId),
  });
}
```

---

## Managing Comments

Add and retrieve comments on pages and blocks.

```typescript
import { Notion, parent, richText, paginate } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Example 1: Add a comment to a page
await notion.comments.create({
  parent: parent.page('page-id'),
  rich_text: richText('This looks great! 🎉').build(),
});

// Example 2: Add a comment with formatted text
await notion.comments.create({
  parent: parent.page('page-id'),
  rich_text: richText.join(
    richText('Thanks for the update, '),
    richText.mentionUser({ object: 'user', id: 'user-id' }),
    richText('! Can you review '),
    richText.mentionPage('related-page-id'),
    richText('?'),
  ),
});

// Example 3: Reply to a discussion
const existingComments = await notion.comments.list('page-id');
const discussionId = existingComments.results[0].discussionId;

await notion.comments.create({
  discussion_id: discussionId,
  rich_text: richText('I agree with this approach.').build(),
});

// Example 4: Add comment with custom display name
await notion.comments.create({
  parent: parent.page('page-id'),
  rich_text: richText('Automated review complete ✓').build(),
  display_name: { type: 'custom', custom: { name: 'CI Bot' } },
});

// Example 5: Get all comments on a page
const allComments = await paginate((cursor) =>
  notion.comments.list('page-id', { start_cursor: cursor }),
);

console.log(`Total comments: ${allComments.length}`);
for (const comment of allComments) {
  console.log(`${comment.getDisplayName()}: ${comment.getPlainText()}`);
}

// Example 6: Add comment to a specific block
await notion.comments.create({
  parent: parent.block('block-id'),
  rich_text: richText('This section needs clarification.').build(),
});

// Example 7: Comment with file attachments (requires uploaded file IDs)
await notion.comments.create({
  parent: parent.page('page-id'),
  rich_text: richText('Attaching the design mockups.').build(),
  attachments: [
    { type: 'file_upload', file_upload_id: 'mockup-1-upload-id' },
    { type: 'file_upload', file_upload_id: 'mockup-2-upload-id' },
  ],
});
```

---

## Batch Operations

These examples process multiple pages or blocks.

```typescript
import { Notion, paginate, paginateIterator, prop } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Example 1: Batch update pages in a database
const databaseId = 'your-database-id';
const pages = await paginate((cursor) =>
  notion.databases.query(databaseId, { start_cursor: cursor }),
);

console.log(`Updating ${pages.length} pages...`);

for (const page of pages) {
  await notion.pages.update(page.id, {
    properties: {
      'Last Reviewed': prop.date(new Date().toISOString().split('T')[0]),
    },
  });
}

console.log('All pages updated!');

// Example 2: Memory-efficient iteration for large datasets
console.log('Processing pages one at a time...');
let count = 0;

for await (const page of paginateIterator((cursor) =>
  notion.databases.query(databaseId, { start_cursor: cursor }),
)) {
  // Process each page without loading all into memory
  console.log(`Processing: ${page.getTitle()}`);
  count++;
}

console.log(`Processed ${count} pages`);

// Example 3: Batch create pages
const newTasks = [
  { name: 'Task 1', priority: 'High' },
  { name: 'Task 2', priority: 'Medium' },
  { name: 'Task 3', priority: 'Low' },
];

const database = await notion.databases.retrieve(databaseId);
const dataSourceId = database.dataSources[0].id;

for (const task of newTasks) {
  await notion.pages.create({
    parent: { data_source_id: dataSourceId, database_id: database.id },
    properties: {
      Name: prop.title(task.name),
      Priority: prop.select(task.priority),
    },
  });
}

// Example 4: Batch trash completed tasks
const completedTasks = await paginate((cursor) =>
  notion.databases.query(databaseId, {
    filter: { property: 'Status', status: { equals: 'Done' } },
    start_cursor: cursor,
  }),
);

console.log(`Trashing ${completedTasks.length} completed tasks...`);
for (const task of completedTasks) {
  await notion.pages.trash(task.id);
}
```

---

## Pagination Patterns

These examples show different strategies to handle paginated results.

```typescript
import { Notion, paginate, paginateIterator, paginateWithMetadata } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Pattern 1: Get all results at once
const allBlocks = await paginate((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor }),
);
console.log(`Total blocks: ${allBlocks.length}`);

// Pattern 2: Iterate one at a time (memory-efficient)
for await (const block of paginateIterator((cursor) =>
  notion.blocks.children.list('page-id', { start_cursor: cursor }),
)) {
  if (block.isTextBlock()) {
    console.log(block.getPlainText());
  }
}

// Pattern 3: Get results with metadata
const { items, pageCount, totalCount } = await paginateWithMetadata((cursor) =>
  notion.databases.query('database-id', { start_cursor: cursor }),
);
console.log(`Fetched ${totalCount} pages across ${pageCount} API calls`);

// Pattern 4: Manual pagination with control
let cursor: string | null = undefined;
let allResults = [];

do {
  const response = await notion.databases.query('database-id', {
    start_cursor: cursor,
    page_size: 50, // Custom page size
  });

  allResults.push(...response.results);
  cursor = response.next_cursor;

  console.log(`Fetched ${response.results.length} results, has more: ${response.has_more}`);
} while (cursor);

console.log(`Total results: ${allResults.length}`);
```

---

## Syncing Data Between Systems

Sync data from external systems to Notion.

```typescript
import { Notion, parent, prop, filter } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

interface ExternalTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  assignee: string;
  dueDate: string;
}

// Simulate fetching tasks from an external API
async function fetchExternalTasks(): Promise<ExternalTask[]> {
  // In reality, this would call an external API
  return [
    {
      id: 'ext-1',
      title: 'Fix login bug',
      status: 'in_progress',
      assignee: 'alice',
      dueDate: '2025-03-15',
    },
    { id: 'ext-2', title: 'Update docs', status: 'todo', assignee: 'bob', dueDate: '2025-03-20' },
  ];
}

async function syncTasksToNotion(databaseId: string) {
  // Get database setup
  const database = await notion.databases.retrieve(databaseId);
  const dataSourceId = database.dataSources[0].id;

  // Fetch external tasks
  const externalTasks = await fetchExternalTasks();

  // Get existing tasks in Notion
  const notionPages = await notion.databases.query(databaseId);
  const existingTaskIds = notionPages.results.map((page) => {
    const idProp = page.properties['External ID'];
    return idProp?.type === 'rich_text' ? idProp.rich_text[0]?.plain_text : null;
  });

  // Sync each external task
  for (const task of externalTasks) {
    const statusMap = {
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Done',
    };

    if (existingTaskIds.includes(task.id)) {
      // Update existing task
      const page = notionPages.results.find((p) => {
        const idProp = p.properties['External ID'];
        return idProp?.type === 'rich_text' && idProp.rich_text[0]?.plain_text === task.id;
      });

      if (page) {
        await notion.pages.update(page.id, {
          properties: {
            Name: prop.title(task.title),
            Status: prop.status(statusMap[task.status]),
            'Due Date': prop.date(task.dueDate),
          },
        });
        console.log(`Updated task: ${task.title}`);
      }
    } else {
      // Create new task
      await notion.pages.create({
        parent: parent.dataSource(dataSourceId, databaseId),
        properties: {
          Name: prop.title(task.title),
          Status: prop.status(statusMap[task.status]),
          'Due Date': prop.date(task.dueDate),
          'External ID': prop.richText(task.id),
        },
      });
      console.log(`Created task: ${task.title}`);
    }
  }

  console.log('Sync complete!');
}

// Run sync
await syncTasksToNotion('your-database-id');
```

---

## Next Steps

- **[Helpers](/guides/helpers/)**: full details on helper functions.
- **[Models](/guides/models/)**: full details on model objects.
- **[API Reference](/api/)**: complete endpoint documentation.
- **[Error Handling](/guides/error-handling/)**: how to handle errors.
- **[Pagination](/guides/pagination/)**: advanced pagination techniques.
