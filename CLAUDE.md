# CLAUDE.md

## Project Overview

`@visus-io/notion-sdk-ts` is a TypeScript client library for the Notion API. Source lives in `src/` with entry point at `src/index.ts`. Uses Zod for schema validation.

## Commands

```bash
bun install              # Install dependencies
bun run build            # Compile TypeScript to dist/ via tsc
bun test                 # Run tests with Vitest
bun run test:watch       # Run tests in watch mode
bun run test:coverage    # Run tests with v8 coverage
bun run lint             # Lint with ESLint
bun run lint:fix         # Lint and auto-fix
bun run format           # Format with Prettier
bun run format:check     # Check formatting
```

## Project Structure

- `src/` — Source code (entry: `index.ts`)
  - `src/api/` — API endpoint modules (`blocks`, `comments`, `databases`, `dataSources`, `fileUploads`, `pages`, `search`, `users`)
  - `src/schemas/` — Zod schemas for Notion API objects
  - `src/models/` — Model classes wrapping parsed schema data
  - `src/helpers/` — Helper utilities (block, file, filter, parent, property, richText, sort)
  - `src/client.ts` — HTTP client
  - `src/notion.ts` — Main Notion client
  - `src/errors.ts` — Error types
  - `src/validation.ts` — Validation utilities
- `dist/` — Compiled output (CommonJS, declarations, source maps)
- Test files are colocated with source using `.test.ts` suffix (e.g., `src/models/block.model.test.ts`)
- Test files are excluded from TypeScript compilation via `tsconfig.json`

## TypeScript Configuration

- Target: ES2017, Module: CommonJS
- Strict mode enabled
- Generates declarations (`.d.ts`) and declaration maps
- Source maps enabled

## Testing

- **Runner:** Vitest with global test APIs enabled (`describe`, `it`, `expect` available without imports, though explicit imports from `vitest` also work)
- **Environment:** Node
- **Coverage:** v8 provider, reports in text/json/html formats

## Linting & Formatting

- **ESLint:** `typescript-eslint` with recommended type-checked rules. Enforces `consistent-type-imports`, `no-floating-promises`, `prefer-const`, `eqeqeq`, and others. No `.js` extensions in imports/exports.
- **Prettier:** Single quotes, semicolons, trailing commas, 100 char print width, 2-space indent.
