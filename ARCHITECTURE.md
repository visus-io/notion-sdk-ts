# Architecture

`@visus-io/notion-sdk-ts` wraps the full Notion REST API with Zod v4 runtime validation, OOP model classes, and ergonomic helper factories. Single runtime dependency: `zod`. Uses Node 18+ built-in `fetch`. Targets Notion API version `2026-03-11` (fixed; cannot be overridden).

```
Notion (facade) --> *API classes (endpoint logic + Zod parsing) --> NotionClient (HTTP + retry)
                                     |
                              Zod schemas (validation)
                                     |
                              Model classes (OOP wrappers)
```

`Notion` is the public entry point. It creates a `NotionClient` (HTTP transport) and instantiates 8 API classes, exposed as `readonly` properties: `pages`, `blocks`, `databases`, `dataSources`, `search`, `users`, `comments`, `fileUploads`.

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
  helpers/              -- Factory functions and builders, one file per domain
                            (block, file, filter, pagination, parent, property, richText, sort)
```

Test files are colocated with source using `.test.ts` suffix (e.g., `block.model.test.ts` next to `block.model.ts`).

## Layer-by-Layer Patterns

### Schemas (`src/schemas/`)

- Sub-schemas as private `const` variables, composed into a main exported schema.
- Always export the inferred type alongside the schema: `export const fooSchema = z.object({...}); export type Foo = z.infer<typeof fooSchema>;`
- `z.discriminatedUnion('type', [...])` for polymorphic objects (parent, rich text, file, mentions, page properties).
- `z.enum([...] as const)` for closed string sets (colors, code languages, block types).
- `z.iso.datetime()` for datetimes, `z.uuid()` for UUIDs, `z.url()` for URLs.
- Generic schema factories for reusable patterns (e.g., `paginatedListSchema(resultSchema)`).

### API Modules (`src/api/`)

- All API classes extend `BaseAPI<TResponse, TModel>` (`base.api.ts`): holds `protected readonly client: NotionClient`, provides `retrieveResource`, `createResource`, `updateResource`, `deleteResource`, `listResources`, `parseAndWrap`, `parsePaginatedList`.
- Constructors call `super(client)`.
- Methods are `async`, take typed options interfaces, return model instances.
- Request flow: validate inputs -> build body -> `this.client.request<T>()` -> parse with Zod -> wrap in model.
- Client-side validation runs before the request via `validateArrayLength()` / `validateStringLength()`.
- Paginated responses use `paginatedListSchema(itemSchema)`, mapping results through model constructors.
- Convenience methods wrap common patterns (e.g., `trash(id)` calls `update(id, { in_trash: true })`).
- Sub-resources use object literals with arrow functions: `readonly children = { list: async (...) => {...} }`.
- Include JSDoc with `@param`, `@returns`, and `@see` links to Notion API docs.

### Models (`src/models/`)

- Extend `BaseModel<T>` (abstract): takes `data` + `schema`, validates via `schema.parse(data)` on construction.
- `toJSON(): T` deep-clones via `structuredClone(this.data)`.
- Abstract getters: `object` and `id`.
- Expose data as getter properties, converting snake_case API fields to camelCase.
- Datetime strings converted to `Date` objects in getters.
- Boolean convenience methods for type checks (e.g., `isTextBlock()`, `isPerson()`, `isInDatabase()`).
- Text extraction methods (e.g., `getPlainText()`, `getTitle()`).

### Helpers (`src/helpers/`)

- Exported as namespace objects: `block`, `richText`, `filter`, `sort`, `prop`, `parent`, `icon`, `cover`, `notionFile`.
- `richText` uses `Object.assign(createFn, { mentionPage, mentionDatabase, ... })` to be both callable and have static methods.
- `RichTextBuilder` provides a chainable/fluent API; `.build()` produces `NotionRichText[]`.
- `RichTextInput` union (`string | RichTextBuilder | NotionRichText`) is accepted by all text-accepting helpers, resolved via `resolveRichText()`.
- Helpers eagerly validate inputs via `validateStringLength()` / `validateArrayLength()`, throwing `NotionValidationError` before any API call.
- Filter helpers return builders with chainable methods producing `FilterCondition`; compound filters use `filter.and()` / `filter.or()`.
- Sort helpers return builders with `.ascending()` / `.descending()` terminal methods.
- Pagination helpers (`paginate`, `paginateIterator`, `paginateWithMetadata`) automate cursor-based pagination for Notion list endpoints.

### Error Handling (`src/errors.ts`, `src/validation.ts`)

Four error classes, all extending `Error` and setting `this.name` explicitly:

- `NotionAPIError` -- HTTP error responses. Has `status`, `code`, `body`, `retryAfterMs`; helpers `isRateLimited()`, `isServiceOverloaded()`, `isNotFound()`, `isUnauthorized()`, `isValidationError()`, `isServerError()`, `isRetryable()`.
- `NotionNetworkError` -- connectivity failures, optional `cause`.
- `NotionRequestTimeoutError` -- timeout exceeded.
- `NotionValidationError` -- client-side size limit violations, thrown before the request is sent.

The client retries `rate_limited` (429, when `retryOnRateLimit` is enabled) and `service_overload` (529, always) errors, using the `Retry-After` header or exponential backoff (`2^attempt * 1000ms`, capped at 60s).

Client-side size limits enforced before requests are defined in the `LIMITS` constant in `validation.ts` (rich text, URLs, email/phone, multi-select/relation/people arrays, comment attachments, payload blocks/bytes) -- read that file for exact values rather than relying on this doc.
