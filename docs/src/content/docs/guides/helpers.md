---
title: Helpers
description: Rich text, block builder, properties, filters, sorting, and other helper factories.
sidebar:
  order: 3
---

The SDK provides namespace objects. These objects replace the verbose JSON the Notion API
requires. All text-accepting helpers accept a `string`, a `RichTextBuilder`, or a raw
`NotionRichText`.

## Table of Contents

- [Rich Text](#rich-text)
- [Block Builder](#block-builder)
- [Page Properties](#page-properties)
- [Filters](#filters)
- [Sorting](#sorting)
- [Parent, Icon, Cover, and File](#parent-icon-cover-and-file)
- [Webhooks](#webhooks)

---

## Rich Text

Build formatted rich text with a chainable API.

### Basic Usage

```typescript
import { richText } from '@visus-io/notion-sdk-ts';

// Plain text
richText('Hello world').build();

// Chained formatting
richText('Important').bold().italic().color('red').build();

// Link
richText('Notion').link('https://notion.so').build();
```

### Combining Multiple Segments

```typescript
// Use richText.join() to combine multiple segments
richText.join(
  richText('Normal '),
  richText('bold').bold(),
  richText(' and '),
  richText('italic').italic(),
);
```

### Formatting Methods

```typescript
richText('text').bold(); // Bold
richText('text').italic(); // Italic
richText('text').strikethrough(); // Strikethrough
richText('text').underline(); // Underline
richText('text').code(); // Inline code
richText('text').color('red'); // Text color
richText('text').link('url'); // Hyperlink
```

### Available Colors

`'default'`, `'gray'`, `'brown'`, `'orange'`, `'yellow'`, `'green'`, `'blue'`, `'purple'`, `'pink'`, `'red'`, `'gray_background'`, `'brown_background'`, `'orange_background'`, `'yellow_background'`, `'green_background'`, `'blue_background'`, `'purple_background'`, `'pink_background'`, `'red_background'`

### Mentions

```typescript
// Page mention
richText.mentionPage('page-id').build();

// Database mention
richText.mentionDatabase('db-id').build();

// User mention
richText.mentionUser({ object: 'user', id: 'user-id' }).build();

// Date mention
richText.mentionDate('2025-03-01').build();
richText.mentionDate('2025-03-01', { end: '2025-03-15' }).build();

// Link preview mention
richText.mentionLinkPreview('https://example.com').build();
```

### Equations

```typescript
// Inline equation (LaTeX syntax)
richText.equation('E=mc^2').build();
richText.equation('\\sum_{i=1}^{n} i').build();
```

---

## Block Builder

These factory functions cover 32 of Notion's 35 block types. Each function returns a plain
object ready for `blocks.children.append()` or `pages.create()`. The block types
`child_database`, `child_page`, and `unsupported` have no dedicated `block.*` factory. Create
`child_database` and `child_page` blocks with the [Databases](/api/) or [Pages](/api/) APIs
instead. The `unsupported` type is read-only.

### Text Blocks

All text blocks accept `string`, `RichTextBuilder`, or `NotionRichText`.

```typescript
import { block, richText } from '@visus-io/notion-sdk-ts';

// Headings
block.heading1('Title');
block.heading2('Subtitle');
block.heading3('Section');
block.heading4('Detail');

// Toggleable headings
block.heading2('Subtitle', { isToggleable: true });

// Paragraph
block.paragraph('Plain text');
block.paragraph(richText('Styled text').bold().color('blue'));

// Lists
block.bulletedListItem('First item');
block.numberedListItem('Step one');
block.toDo('Task', { checked: true });

// Toggle (collapsible)
block.toggle('Click to expand', {
  children: [block.paragraph('Hidden content')],
});

// Quote
block.quote('A wise saying');

// Callout
block.callout('Heads up!', {
  icon: { type: 'emoji', emoji: '⚠️' },
  color: 'yellow_background',
});

// Template
block.template('Section template');
block.template('Template with content', {
  children: [block.paragraph('Default content')],
});
```

> **Notion manages meeting notes blocks on the server. Client code cannot build them.** Notion's
> AI meeting notes feature sets a `meeting_notes` block's title, status, and child block IDs:
> summary, notes, and transcript. A client cannot build this structure by hand.
> `block.meetingNotes()` is the renamed successor to the old `block.transcription()`. See the
> [Migration Guide](/migration-guide/) for details. The SDK keeps this method only to avoid a
> sudden removal from the helper surface. `block.meetingNotes()` is now `@deprecated`. Do not use
> it in new code. To read meeting notes, use [`blocks.meetingNotes.query()`](/api/) or
> [`pages.getMarkdown({ include_transcript: true })`](/api/).

### Code & Math

```typescript
// Code block
block.code('const x = 42;', 'typescript');
block.code('console.log("hello")', 'javascript', { caption: 'Example' });

// Equation block
block.equation('\\sum_{i=1}^{n} i');
```

**Supported languages:** `abap`, `arduino`, `bash`, `basic`, `c`, `clojure`, `coffeescript`, `c++`, `c#`, `css`, `dart`, `diff`, `docker`, `elixir`, `elm`, `erlang`, `flow`, `fortran`, `f#`, `gherkin`, `glsl`, `go`, `graphql`, `groovy`, `haskell`, `html`, `java`, `javascript`, `json`, `julia`, `kotlin`, `latex`, `less`, `lisp`, `livescript`, `lua`, `makefile`, `markdown`, `markup`, `matlab`, `mermaid`, `nix`, `objective-c`, `ocaml`, `pascal`, `perl`, `php`, `plain text`, `powershell`, `prolog`, `protobuf`, `python`, `r`, `reason`, `ruby`, `rust`, `sass`, `scala`, `scheme`, `scss`, `shell`, `sql`, `swift`, `typescript`, `vb.net`, `verilog`, `vhdl`, `visual basic`, `webassembly`, `xml`, `yaml`, `java/c/c++/c#`

### Media Blocks

Media blocks accept a URL string or a `FileSource` object.

```typescript
// Images
block.image('https://example.com/photo.png');
block.image('https://example.com/photo.png', { caption: 'Photo' });

// Video
block.video('https://example.com/video.mp4');

// Audio
block.audio('https://example.com/song.mp3');

// File
block.file('https://example.com/doc.pdf');

// PDF
block.pdf('https://example.com/doc.pdf');

// Using file upload IDs
import { notionFile } from '@visus-io/notion-sdk-ts';

block.image(notionFile.upload('upload-id'));
```

### Embed Blocks

```typescript
// Generic embed
block.embed('https://twitter.com/example/status/123');

// Bookmark
block.bookmark('https://example.com');
block.bookmark('https://example.com', { caption: 'Example site' });

// Link preview
block.linkPreview('https://github.com/example/repo');
```

### Structural Blocks

```typescript
// Divider
block.divider();

// Breadcrumb
block.breadcrumb();

// Table of contents
block.tableOfContents();
block.tableOfContents({ color: 'gray_background' });

// Table
block.table(3, {
  hasColumnHeader: true,
  hasRowHeader: false,
  children: [
    block.tableRow(['Name', 'Role', 'Status']),
    block.tableRow(['Alice', 'Engineer', 'Active']),
    block.tableRow(['Bob', 'Designer', 'Active']),
  ],
});

// Column list (multi-column layout)
block.columnList([
  [block.paragraph('Column 1')],
  [block.paragraph('Column 2')],
  [block.paragraph('Column 3')],
]);

// Tabs: only paragraph blocks can be direct children of a tab block. Each tab
// is modeled as one paragraph. Its rich text is the label. Its `children`
// field holds the tab's content.
import { icon } from '@visus-io/notion-sdk-ts';

block.tab([
  { label: 'Overview', children: [block.paragraph('Intro text')] },
  { label: 'Details', icon: icon.emoji('📋'), children: [block.paragraph('More info')] },
]);
```

### Synced Blocks

```typescript
// Original synced block
block.syncedBlock({
  children: [block.paragraph('Original content')],
});

// Reference to synced block
block.syncedBlock({ syncedFrom: 'source-block-id' });
```

---

## Page Properties

These factory functions set page property values. Use them when you create or update pages.

### Basic Properties

```typescript
import { prop, richText } from '@visus-io/notion-sdk-ts';

// Title
prop.title('My Task');

// Rich text
prop.richText('Some notes');
prop.richText(richText('Important').bold());

// Number
prop.number(95);
prop.number(3.14);

// Checkbox
prop.checkbox(true);
prop.checkbox(false);

// URL
prop.url('https://example.com');

// Email
prop.email('user@example.com');

// Phone number
prop.phoneNumber('+1-555-0100');
```

### Select Properties

```typescript
// Single select
prop.select('High');
prop.select('Option Name');

// Multi-select
prop.multiSelect(['urgent', 'frontend']);
prop.multiSelect(['tag1', 'tag2', 'tag3']);

// Status
prop.status('In Progress');
```

### Date Properties

```typescript
// Single date
prop.date('2025-03-01');

// Date range
prop.date('2025-03-01', { end: '2025-03-15' });

// With time
prop.date('2025-03-01T10:00:00');

// Date range with time
prop.date('2025-03-01T10:00:00', { end: '2025-03-01T11:00:00' });

// With timezone
prop.date('2025-03-01T10:00:00', { timeZone: 'America/New_York' });
```

### Relation & People

```typescript
// Relation (link to other pages)
prop.relation(['page-id-1', 'page-id-2']);
prop.relation(['page-id']); // Single relation

// People
prop.people(['user-id-1', 'user-id-2']);
prop.people(['user-id']); // Single person
```

### Files

```typescript
// Files (external URLs or uploaded files)
prop.files([
  { name: 'doc.pdf', url: 'https://example.com/doc.pdf' },
  { name: 'image.png', url: 'https://example.com/image.png' },
]);

// Single file
prop.files([{ name: 'doc.pdf', url: 'https://example.com/doc.pdf' }]);
```

### Verification

```typescript
// Mark verified (optionally with a verification date)
prop.verification('verified');
prop.verification('verified', { start: '2025-01-15' });
prop.verification('verified', { start: '2025-01-15', end: '2025-06-15' });

// Mark unverified
prop.verification('unverified');
```

### Clearing Properties

Pass `null` to clear a **scalar** property value:

```typescript
prop.number(null); // Clear number
prop.select(null); // Clear select
prop.status(null); // Clear status
prop.date(null); // Clear date
prop.url(null); // Clear URL
prop.email(null); // Clear email
prop.phoneNumber(null); // Clear phone number
```

**Array-based properties**, such as `multiSelect`, `relation`, `people`, and `files`, do not
accept `null`. Pass an empty array to clear them instead:

```typescript
prop.multiSelect([]); // Clear multi-select
prop.relation([]); // Clear relation
prop.people([]); // Clear people
prop.files([]); // Clear files
```

---

## Filters

The filter helpers return chainable builders for database queries.

### Property Filters

```typescript
import { filter } from '@visus-io/notion-sdk-ts';

// Status
filter.status('Status').equals('Active');
filter.status('Status').doesNotEqual('Archived');

// Select
filter.select('Priority').equals('High');
filter.select('Priority').doesNotEqual('Low');

// Multi-select
filter.multiSelect('Tags').contains('urgent');
filter.multiSelect('Tags').doesNotContain('archived');

// Number
filter.number('Score').equals(100);
filter.number('Score').doesNotEqual(0);
filter.number('Score').greaterThan(80);
filter.number('Score').greaterThanOrEqualTo(90);
filter.number('Score').lessThan(50);
filter.number('Score').lessThanOrEqualTo(60);

// Checkbox
filter.checkbox('Done').equals(true);
filter.checkbox('Done').equals(false);

// Date
filter.date('Due Date').equals('2025-03-01');
filter.date('Due Date').before('2025-06-01');
filter.date('Due Date').after('2025-01-01');
filter.date('Due Date').onOrBefore('2025-06-01');
filter.date('Due Date').onOrAfter('2025-01-01');

// Date relative filters
filter.date('Due Date').pastWeek();
filter.date('Due Date').pastMonth();
filter.date('Due Date').pastYear();
filter.date('Due Date').nextWeek();
filter.date('Due Date').nextMonth();
filter.date('Due Date').nextYear();

// Text (title or rich_text properties)
filter.text('Description').equals('exact match');
filter.text('Description').doesNotEqual('not this');
filter.text('Description').contains('keyword');
filter.text('Description').doesNotContain('exclude');
filter.text('Description').startsWith('prefix');
filter.text('Description').endsWith('suffix');

// Title
filter.title('Name').equals('Task Name');
filter.title('Name').contains('important');
filter.title('Name').startsWith('Project');

// URL, Email, Phone
filter.url('Website').isNotEmpty();
filter.url('Website').isEmpty();
filter.email('Contact').isNotEmpty();
filter.email('Contact').isEmpty();
filter.phoneNumber('Phone').isNotEmpty();

// People
filter.people('Assignee').contains('user-id');
filter.people('Assignee').doesNotContain('user-id');
filter.people('Assignee').isEmpty();
filter.people('Assignee').isNotEmpty();

// Relation
filter.relation('Project').contains('page-id');
filter.relation('Project').doesNotContain('page-id');
filter.relation('Project').isEmpty();
filter.relation('Project').isNotEmpty();

// Files
filter.files('Attachments').isEmpty();
filter.files('Attachments').isNotEmpty();
```

### Timestamp Filters

Timestamp filters do not require a property name.

```typescript
// Created time
filter.createdTime().after('2025-01-01');
filter.createdTime().before('2025-12-31');
filter.createdTime().onOrAfter('2025-01-01');
filter.createdTime().pastWeek();

// Last edited time
filter.lastEditedTime().after('2025-02-01');
filter.lastEditedTime().pastMonth();
```

### Compound Filters

```typescript
// AND: all conditions must be true
filter.and(
  filter.status('Status').equals('Active'),
  filter.number('Score').greaterThan(80),
  filter.date('Due Date').nextWeek(),
);

// OR: at least one condition must be true
filter.or(
  filter.select('Priority').equals('High'),
  filter.date('Due Date').before('2025-03-01'),
  filter.checkbox('Urgent').equals(true),
);

// Nested conditions
filter.and(
  filter.status('Status').doesNotEqual('Done'),
  filter.or(filter.select('Priority').equals('High'), filter.date('Due Date').nextWeek()),
);
```

---

## Sorting

Create sort parameters for database queries.

```typescript
import { sort } from '@visus-io/notion-sdk-ts';

// Property sorts
const sorts = [
  sort.property('Priority').ascending(),
  sort.property('Due Date').descending(),
  sort.property('Name').ascending(),
];

// Timestamp sorts
const timestampSorts = [sort.createdTime().descending(), sort.lastEditedTime().ascending()];

// Use in database query
await notion.databases.query('database-id', {
  sorts: [
    sort.property('Status').ascending(),
    sort.property('Priority').descending(),
    sort.property('Due Date').ascending(),
  ],
});
```

---

## Parent, Icon, Cover, and File

These helper functions build parent references, icons, covers, and file sources.

### Parent Helpers

```typescript
import { parent } from '@visus-io/notion-sdk-ts';

// Page parent
parent.page('page-id');

// Data source parent (for creating pages in databases)
parent.dataSource('data-source-id', 'database-id');

// Workspace parent (for creating top-level pages/databases)
parent.workspace();

// Block parent (for comments on blocks)
parent.block('block-id');
```

### Icon Helpers

```typescript
import { icon } from '@visus-io/notion-sdk-ts';

// Emoji icon
icon.emoji('🚀');
icon.emoji('📚');

// External image icon
icon.external('https://example.com/icon.png');

// Uploaded file icon
icon.fileUpload('upload-id');

// Native icon-picker icon (optionally colored)
icon.native('star circle');
icon.native('star circle', 'blue');

// Custom workspace emoji (see notion.customEmojis.list())
icon.customEmoji('custom-emoji-id');
```

**Native icon colors:** `'gray'`, `'lightgray'`, `'brown'`, `'yellow'`, `'orange'`, `'green'`, `'blue'`, `'purple'`, `'pink'`, `'red'`

### Cover Helpers

```typescript
import { cover } from '@visus-io/notion-sdk-ts';

// External image cover
cover.external('https://example.com/banner.jpg');

// Uploaded file cover
cover.fileUpload('upload-id');
```

### File Source Helpers

```typescript
import { notionFile } from '@visus-io/notion-sdk-ts';

// External file
notionFile.external('https://example.com/doc.pdf');

// Uploaded file
notionFile.upload('upload-id');

// Use in blocks
block.image(notionFile.external('https://example.com/photo.jpg'));
block.pdf(notionFile.upload('upload-id'));
```

---

## Webhooks

Sign and verify Notion webhook payloads. Notion signs webhook requests with HMAC-SHA256. Notion
keys the signature with the subscription's verification token. Notion signs the raw JSON request
body and sends the signature in an `X-Notion-Signature: sha256=<hex digest>` header.

```typescript
import { webhook } from '@visus-io/notion-sdk-ts';

// Verify an incoming webhook request
const isValid = webhook.verifySignature(
  rawBody,
  req.headers['x-notion-signature'],
  verificationToken,
);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}

// Sign a payload yourself, e.g. to generate test signatures
const signature = webhook.sign({ event: 'page.updated' }, verificationToken);
```

`verifySignature()` returns `false` for any mismatch or malformed input. It never throws an
error. Internally, it uses a constant-time comparison.

> **`rawBody` must be the exact raw request body Notion sent.** Do not use
> `JSON.stringify(parsedBody)`. Re-serializing a parsed object can produce a different byte
> sequence: a different key order or different whitespace. A different byte sequence silently
> breaks verification. Use your framework's raw-body access, for example Express's
> `express.raw()` and `req.rawBody`. Do not use `req.body` after JSON middleware has already
> parsed the request.

---

## Related Pages

- **[Common Use Cases](/guides/common-use-cases/)**: practical examples that use helpers.
- **[Models](/guides/models/)**: details on the returned model objects.
- **[API Reference](/api/)**: how to use helpers with API endpoints.
- **[Request Size Limits](/guides/request-size-limits/)**: size limits enforced by helpers.
