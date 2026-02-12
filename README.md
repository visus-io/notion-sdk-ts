# @visus-io/notion-sdk-ts

[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/visus-io/notion-sdk-ts/ci.yml?style=for-the-badge&logo=github)](https://github.com/visus-io/notion-sdk-ts/actions/workflows/ci.yaml)

[![Sonar Quality Gate](https://img.shields.io/sonar/quality_gate/visus%3Anotion-sdk-ts?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonarcloud&logoColor=white)](https://sonarcloud.io/summary/overall?id=visus%3Anotion-sdk-ts)
[![Sonar Coverage](https://img.shields.io/sonar/coverage/visus%3Anotion-sdk-ts?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonarcloud&logoColor=white)](https://sonarcloud.io/summary/overall?id=visus%3Anotion-sdk-ts)

[![NPM Version](https://img.shields.io/npm/v/%40visus-io%2Fnotion-sdk-ts?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@visus-io/notion-sdk-ts)
![NPM Downloads](https://img.shields.io/npm/dm/%40visus-io%2Fnotion-sdk-ts?style=for-the-badge&logo=npm)
![GitHub](https://img.shields.io/github/license/visus-io/notion-sdk-ts?style=for-the-badge)

A type-safe TypeScript SDK for the Notion API with Zod validation, OOP models, and ergonomic helpers.

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

**Requirements:** Node.js 18+ (uses native `fetch`)

## Quick Start

```typescript
import { Notion, block, richText, filter, sort, prop, parent } from '@visus-io/notion-sdk-ts';

const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// Retrieve a page
const page = await notion.pages.retrieve('page-id');
console.log(page.getTitle());

// Create a page in a database
const database = await notion.databases.retrieve('database-id');
const dataSourceId = database.dataSources[0].id;

await notion.pages.create({
  parent: parent.dataSource(dataSourceId, database.id),
  properties: {
    Name: prop.title('New Task'),
    Status: prop.status('In Progress'),
    Priority: prop.select('High'),
  },
});

// Append blocks to a page
await notion.blocks.children.append('page-id', {
  children: [
    block.heading2('Meeting Notes'),
    block.paragraph('Discussed the roadmap for Q2.'),
    block.toDo('Follow up with design', { checked: false }),
  ],
});

// Query a database with filters
const results = await notion.databases.query('database-id', {
  filter: filter.and(
    filter.status('Status').equals('In Progress'),
    filter.select('Priority').equals('High'),
  ),
  sorts: [sort.property('Due Date').ascending()],
});
```

## Documentation

Comprehensive documentation is available in the [**GitHub Wiki**](https://github.com/visus-io/notion-sdk-ts/wiki):

### Getting Started

- [**Getting Started**](https://github.com/visus-io/notion-sdk-ts/wiki/Getting-Started) - Installation, quick start, and basic configuration
- [**Migration Guide**](https://github.com/visus-io/notion-sdk-ts/wiki/Migration-Guide) - Migrating to API version 2025-09-03
- [**Common Use Cases**](https://github.com/visus-io/notion-sdk-ts/wiki/Common-Use-Cases) - Practical examples and workflows

### Core Concepts

- [**Helpers**](https://github.com/visus-io/notion-sdk-ts/wiki/Helpers) - Rich Text, Block Builder, Properties, Filters, Sorting
- [**Models**](https://github.com/visus-io/notion-sdk-ts/wiki/Models) - Page, Block, Database, DataSource, User, Comment, FileUpload
- [**API Reference**](https://github.com/visus-io/notion-sdk-ts/wiki/API-Reference) - Complete API endpoint documentation

### Configuration & Advanced Topics

- [**Configuration & Features**](https://github.com/visus-io/notion-sdk-ts/wiki/Configuration) - Client options, rate limiting, retries
- [**Error Handling**](https://github.com/visus-io/notion-sdk-ts/wiki/Error-Handling) - Error types, codes, and handling patterns
- [**Pagination**](https://github.com/visus-io/notion-sdk-ts/wiki/Pagination) - Automatic pagination helpers
- [**Request Size Limits**](https://github.com/visus-io/notion-sdk-ts/wiki/Request-Size-Limits) - Notion API size limits

### Development

- [**TypeScript Support**](https://github.com/visus-io/notion-sdk-ts/wiki/TypeScript-Support) - Types, schemas, and type safety
- [**Development & Contributing**](https://github.com/visus-io/notion-sdk-ts/wiki/Development) - Project structure and architecture

## Migration Notice

**This SDK now defaults to Notion API version `2025-09-03`** (previously `2022-06-28`). This version introduces breaking changes for multi-source database support.

### Key Changes

- **Database creation:** Properties moved to `initial_data_source.properties`
- **Database updates:** Use Data Sources API for property changes
- **Page creation:** Requires both data source ID and database ID
- **Search API:** Returns `DataSource` objects instead of `Database`

### Quick Migration Example

```typescript
// OLD (2022-06-28)
await notion.pages.create({
  parent: parent.database('database-id'),
  properties: { Name: prop.title('Task') },
});

// NEW (2025-09-03)
const db = await notion.databases.retrieve('database-id');
const dataSourceId = db.dataSources[0].id;

await notion.pages.create({
  parent: parent.dataSource(dataSourceId, db.id),
  properties: { Name: prop.title('Task') },
});
```

See the [**Migration Guide**](https://github.com/visus-io/notion-sdk-ts/wiki/Migration-Guide) for complete details.

## Development

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript

npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

npm run lint             # ESLint
npm run lint:fix         # Auto-fix
npm run format           # Prettier
```

See [**Development & Contributing**](https://github.com/visus-io/notion-sdk-ts/wiki/Development) for more details.

## Links

- [**Documentation Wiki**](https://github.com/visus-io/notion-sdk-ts/wiki)
- [**GitHub Repository**](https://github.com/visus-io/notion-sdk-ts)
- [**npm Package**](https://www.npmjs.com/package/@visus-io/notion-sdk-ts)
- [**Notion API Documentation**](https://developers.notion.com/reference/intro)
- [**Notion API Changelog**](https://developers.notion.com/page/changelog)
