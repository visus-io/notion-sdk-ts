# @visus-io/notion-sdk-ts

[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/visus-io/notion-sdk-ts/ci.yml?style=for-the-badge&logo=github)](https://github.com/visus-io/notion-sdk-ts/actions/workflows/ci.yaml)
[![Sonar Quality Gate](https://img.shields.io/sonar/quality_gate/visus%3Anotion-sdk-ts?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonar&logoColor=white)](https://sonarcloud.io/summary/overall?id=visus%3Anotion-sdk-ts)
[![Sonar Coverage](https://img.shields.io/sonar/coverage/visus%3Anotion-sdk-ts?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonar&logoColor=white)](https://sonarcloud.io/summary/overall?id=visus%3Anotion-sdk-ts)

[![NPM Version](https://img.shields.io/npm/v/%40visus-io%2Fnotion-sdk-ts?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@visus-io/notion-sdk-ts)
![NPM Downloads](https://img.shields.io/npm/dm/%40visus-io%2Fnotion-sdk-ts?style=for-the-badge&logo=npm)
![Static Badge](https://img.shields.io/badge/license-mit-green?style=for-the-badge)

A type-safe TypeScript SDK for the Notion API with Zod validation, OOP models, and ergonomic helpers.

## Features

- **Type-safe** Zod v4 runtime validation on every API response; full TypeScript declarations
- **Complete API coverage** Pages, Blocks, Databases, Data Sources, Comments, Search, Users, File Uploads, Async Tasks, Custom Emojis, Views
- **Ergonomic helpers** `block`, `richText`, `filter`, `sort`, `prop`, `parent`, `icon`, `cover`, `paginate` factories and a `webhook` signature-verification helper eliminate verbose JSON and boilerplate
- **OOP models** `Page`, `Block`, `Database`, `User`, `Comment`, `DataSource`, `FileUpload`, `RichText`, `AsyncTask`, `CustomEmoji`, `View` with convenience methods
- **Automatic pagination** `paginate()`, `paginateIterator()`, and `paginateWithMetadata()` helpers automatically fetch all pages, plus `iterateAllDataSourceRows()`/`collectAllDataSourceRows()` to work around the 10,000-result query cap
- **Automatic rate limiting** Respects `Retry-After` header with exponential backoff fallback (configurable)
- **Client-side size validation** Enforces Notion API size limits before sending requests
- **Zero bloat** Single runtime dependency (`zod`); uses built-in `fetch` (Node 18+)

## Installation

```bash
npm install @visus-io/notion-sdk-ts
# or
bun add @visus-io/notion-sdk-ts
```

**Requirements:** Node.js 18+ or Bun 1.3.10+ (uses native `fetch`)

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

Full documentation — guides plus a generated API reference — is hosted at [nts.projects.visus.io](https://nts.projects.visus.io). Source lives in [`docs/`](./docs); run it locally:

```bash
bun run docs:dev
```

## Migration Notice

**This SDK now targets Notion API version `2026-03-11`** (upgraded from `2025-09-03` in v3.x; originally `2022-06-28` in v1.x). The API version is fixed — it cannot be overridden via client options. See the [Migration Guide](./docs/src/content/docs/migration-guide.md) for complete upgrade details.

## Development

This project uses [Bun](https://bun.sh) as its package manager for faster dependency installation and script execution.

### Prerequisites

Install Bun if you haven't already:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Development Commands

```bash
bun install              # Install dependencies
bun run build            # Compile TypeScript

bun run test                 # Run tests
bun run test:watch       # Watch mode
bun run test:coverage    # Coverage report

bun run lint             # ESLint
bun run lint:fix         # Auto-fix
bun run format           # Prettier

bun run docs:dev         # Run the docs site locally
bun run docs:build       # Build the docs site
```

> **Note:** While this project uses Bun for development, the published package works with both Node.js 18+ and Bun 1.3.10+.

See [**ARCHITECTURE.md**](./ARCHITECTURE.md) for project structure and architecture.

## Contributing

Contributions are welcome! See [**CONTRIBUTING.md**](./CONTRIBUTING.md) for how to get started.

## Links

- [**Documentation**](https://nts.projects.visus.io)
- [**GitHub Repository**](https://github.com/visus-io/notion-sdk-ts)
- [**npm Package**](https://www.npmjs.com/package/@visus-io/notion-sdk-ts)
- [**Notion API Documentation**](https://developers.notion.com/reference/intro)
- [**Notion API Changelog**](https://developers.notion.com/page/changelog)
