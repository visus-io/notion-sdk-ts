# Copilot Instructions

## Project Overview

`@visus-io/notion-sdk-ts` is a type-safe TypeScript SDK for the Notion API. It wraps the full Notion REST API with Zod v4 runtime validation, OOP model classes, and ergonomic helper factories. The single runtime dependency is `zod`; it uses Node 18+ built-in `fetch`.

### Architecture

```
Notion (facade) --> *API classes (endpoint logic + Zod parsing) --> NotionClient (HTTP + retry)
                                     |
                              Zod schemas (validation)
                                     |
                              Model classes (OOP wrappers)
```

The `Notion` class is the public entry point. It creates a `NotionClient` (HTTP transport) and instantiates all 8 API classes, exposed as `readonly` properties: `pages`, `blocks`, `databases`, `dataSources`, `search`, `users`, `comments`, `fileUploads`.

## Commands

```bash
npm run build            # Compile TypeScript to dist/ via tsc
npm test                 # Run tests with Vitest
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with v8 coverage
npm run lint             # Lint with ESLint
npm run lint:fix         # Lint and auto-fix
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

## Project Structure

```
src/
  index.ts              -- Barrel re-export of everything
  notion.ts             -- Notion facade class
  client.ts             -- HTTP client with retry logic
  errors.ts             -- 4 error classes (API, Network, Timeout, Validation)
  validation.ts         -- LIMITS constants and validation functions
  api/                  -- API endpoint modules (one per Notion resource)
  schemas/              -- Zod schemas and inferred types
  models/               -- OOP model classes wrapping parsed data
  helpers/              -- Factory functions and builders for API objects
```

Test files are colocated with source using `.test.ts` suffix (e.g., `block.model.test.ts` next to `block.model.ts`).

## Coding Conventions

### File Naming

- Use `camelCase` with a domain suffix: `block.schema.ts`, `block.model.ts`, `block.helpers.ts`
- API modules use plural nouns: `blocks.api.ts`, `pages.api.ts`, `fileUploads.api.ts`
- Test files: `*.test.ts` colocated with their source file

### Naming

- **Classes:** PascalCase (`Block`, `NotionClient`, `BlocksAPI`, `RichTextBuilder`)
- **Interfaces/Types:** PascalCase (`NotionBlock`, `CreatePageOptions`, `PaginationParameters`)
- **Constants:** UPPER_SNAKE_CASE (`LIMITS`, `NOTION_COLORS`, `CODE_BLOCK_LANGUAGES`)
- **Functions/variables:** camelCase (`validateStringLength`, `resolveRichText`)
- **Exported namespace objects:** camelCase (`block`, `richText`, `filter`, `sort`, `prop`, `parent`, `icon`, `cover`, `notionFile`)

### Imports and Exports

- **Type-only imports required:** Always use `import type { X }` for type-only imports (enforced by ESLint `consistent-type-imports`)
- Mixed imports are fine: `import { NotionClient, type NotionClientOptions } from './client'`
- **No `.js` extensions** in import/export paths (enforced by ESLint)
- **Named exports only** -- no default exports anywhere in the codebase
- Each subdirectory has a barrel `index.ts` using `export *` or named re-exports
- The top-level `src/index.ts` re-exports everything from all subdirectories

### Formatting (Prettier)

- Single quotes, semicolons, trailing commas
- 100 character print width, 2-space indentation
- No tabs

### TypeScript

- Target: ES2017, Module: CommonJS, strict mode enabled
- Prefer `as const` arrays over TypeScript enums: `const THING = [...] as const`
- Derive types from const arrays: `type Thing = (typeof THING)[number]`
- Use numeric separators for readability: `2_000`, `60_000`, `500 * 1_024`
- Prefix unused parameters with `_`

## Layer-by-Layer Patterns

### Schemas (`src/schemas/`)

Zod schemas define the shape of all Notion API objects and provide inferred TypeScript types.

- Define sub-schemas as `const` variables (private), compose into a main exported schema
- Always export the inferred type alongside the schema:
  ```typescript
  export const fooSchema = z.object({ ... });
  export type Foo = z.infer<typeof fooSchema>;
  ```
- Use `z.discriminatedUnion('type', [...])` for polymorphic objects (parent, rich text, file, mentions, page properties)
- Use `z.enum([...] as const)` for closed string sets (colors, code languages, block types)
- Use `z.iso.datetime()` for datetimes, `z.uuid()` for UUIDs, `z.url()` for URLs
- Generic schema factories are used for reusable patterns (e.g., `paginatedListSchema(resultSchema)`)

### API Modules (`src/api/`)

Each API class encapsulates one Notion resource's endpoints.

- Constructor takes `private client: NotionClient`
- Methods are `async`, take typed options interfaces, return model instances
- Request flow: validate inputs -> build body -> `this.client.request<T>()` -> parse with Zod -> wrap in model
- Client-side validation runs before the request via `validateArrayLength()` / `validateStringLength()` from `validation.ts`
- Paginated list responses use `paginatedListSchema(itemSchema)`, then map results through model constructors
- Convenience methods wrap common patterns (e.g., `archive(id)` calls `update(id, { archived: true })`)
- Sub-resources use object literals with arrow functions: `readonly children = { list: async (...) => {...} }`
- Include JSDoc with `@param`, `@returns`, and `@see` links to Notion API docs

### Models (`src/models/`)

OOP wrappers around validated schema data, extending `BaseModel<T>`.

- `BaseModel<T>` is abstract, takes `data` + `schema`, validates via `schema.parse(data)` on construction
- Provides `toJSON(): T` (deep clone via `JSON.parse(JSON.stringify(this.data))`)
- Abstract getters: `object` and `id`
- Concrete models expose data as **getter properties**, converting snake_case API fields to camelCase
- Datetime strings are converted to `Date` objects in getters
- Boolean convenience methods for type checks (e.g., `isTextBlock()`, `isPerson()`, `isInDatabase()`)
- Text extraction methods (e.g., `getPlainText()`, `getTitle()`)

### Helpers (`src/helpers/`)

Factory functions organized as namespace objects for ergonomic API object construction.

- Exported as namespace objects: `block`, `richText`, `filter`, `sort`, `prop`, `parent`, `icon`, `cover`, `notionFile`
- The `richText` export uses `Object.assign(createFn, { mentionPage, mentionDatabase, ... })` to be both callable and have static methods
- `RichTextBuilder` provides a chainable/fluent API; `.build()` produces `NotionRichText[]`
- `RichTextInput` union type (`string | RichTextBuilder | NotionRichText`) is accepted by all text-accepting helpers, resolved via `resolveRichText()`
- Helpers eagerly validate inputs via `validateStringLength()` / `validateArrayLength()`, throwing `NotionValidationError` before any API call
- Filter helpers return builder instances with chainable methods producing `FilterCondition` objects; compound filters use `filter.and()` / `filter.or()`
- Sort helpers return builders with `.ascending()` / `.descending()` terminal methods

### Error Handling (`src/errors.ts`, `src/validation.ts`)

Four error classes, all extending `Error`:

| Class                       | Domain                            | Key Properties                                                                             |
| --------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| `NotionAPIError`            | HTTP error responses              | `status`, `code`, `body`, `retryAfterMs`; helpers: `isRateLimited()`, `isNotFound()`, etc. |
| `NotionNetworkError`        | Connectivity failures             | Optional `cause`                                                                           |
| `NotionRequestTimeoutError` | Timeout exceeded                  | --                                                                                         |
| `NotionValidationError`     | Client-side size limit violations | Thrown before request                                                                      |

All error classes set `this.name` explicitly and use `Error.captureStackTrace` (with a typed cast for V8).

The client only retries `rate_limited` (429) errors, using `Retry-After` header or exponential backoff (`2^attempt * 1000ms`, capped at 60s).

## Testing Conventions

- **Framework:** Vitest with `globals: true`, though tests also explicitly `import { describe, expect, it } from 'vitest'`
- **Structure:** Top-level `describe()` for module/class, nested `describe()` for groups, `it('should ...')` for cases
- **Section dividers:** Comment lines of dashes (`// -------...`) separate logical test groups
- **Model tests:** Construct with realistic mock data matching full Notion API response shapes; assert getters and methods
- **Helper tests:** Call factory functions; assert returned plain objects with `toEqual()` for exact shape matching
- **Client tests:** Mock `fetch` via `vi.fn()` injected through `NotionClientOptions.fetch`; use `vi.useFakeTimers()` for retry tests; use `expect.unreachable()` for expected-throw paths
- **Validation tests:** Use `expect(() => ...).toThrow(ErrorClass)` and `expect(() => ...).toThrow(/pattern/)` for both class and message matching; include boundary tests (at limit, over limit)
- **No external mocking libraries** -- only Vitest's built-in `vi`

## Key Idioms

- **No default exports** -- named exports exclusively throughout the entire codebase
- **`as const` arrays + `z.enum()`** instead of TypeScript enums
- **Double validation** -- Zod validates API responses; helpers validate inputs client-side before requests
- **Generic schema factories** -- e.g., `paginatedListSchema(resultSchema)` for reusable paginated response parsing
- **`Object.assign` for function namespaces** -- makes a function both callable and extensible with static methods
- **`readonly children = { ... }` pattern** -- object literals with arrow functions for sub-resource namespaces (e.g., `blocks.children.list()`)
- **Deep clone via JSON round-trip** -- `toJSON()` uses `JSON.parse(JSON.stringify(this.data))`

## Dependencies

| Dependency                     | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| `zod` (v4)                     | Runtime schema validation for all API objects |
| `typescript`                   | TypeScript compiler                           |
| `vitest`                       | Test runner                                   |
| `@vitest/coverage-v8`          | Code coverage                                 |
| `eslint` + `typescript-eslint` | Linting                                       |
| `prettier`                     | Code formatting                               |

## ESLint Rules to Follow

- `consistent-type-imports` -- must use `type` keyword for type-only imports
- `explicit-function-return-type` -- functions should declare return types
- `no-floating-promises` -- async promises must be awaited or handled
- `no-explicit-any` -- avoid `any`; use `unknown` when the type is truly unknown
- `prefer-const`, `no-var` -- always use `const`; `let` only when reassignment is needed
- `eqeqeq` -- strict equality (except `== null` is allowed)
- `complexity` max 15, `max-depth` 4, `max-lines-per-function` 150
- `prefer-arrow-callback`, `prefer-template`, `object-shorthand`
- No `.js` extensions in imports/exports
