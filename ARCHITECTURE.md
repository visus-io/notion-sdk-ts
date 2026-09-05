# Architecture

`@visus-io/notion-sdk-ts` wraps the full Notion REST API. It uses Zod v4 for runtime validation.
It provides object-oriented model classes and helper factories. The SDK has one runtime
dependency: `zod`. It uses the built-in `fetch` function in Node 22 and later. The SDK uses Notion
API version `2026-03-11`. You cannot change this version.

```
Notion (facade) --> *API classes (endpoint logic + Zod parsing) --> NotionClient (HTTP + retry)
                                     |
                              Zod schemas (validation)
                                     |
                              Model classes (OOP wrappers)
```

`Notion` is the public entry point. It creates one `NotionClient` for HTTP transport. It creates
11 API classes. Each API class is a `readonly` property: `pages`, `blocks`, `databases`,
`dataSources`, `search`, `users`, `comments`, `fileUploads`, `asyncTasks`, `views`, and
`customEmojis`.

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
                            (block, file, filter, pagination, parent, property, richText, sort, webhook)
```

Test files stay in the same directory as their source files. Each test file has the suffix
`.test.ts`. Example: `block.model.test.ts` stays next to `block.model.ts`.

## Patterns for Each Layer

### Schemas (`src/schemas/`)

- Define sub-schemas as private `const` variables. Combine them into one exported schema.
- Always export the inferred type together with the schema:
  `export const fooSchema = z.object({...}); export type Foo = z.infer<typeof fooSchema>;`
- Use `z.discriminatedUnion('type', [...])` for polymorphic objects. Examples: parent, rich text,
  file, mentions, and page properties.
- Use `z.enum([...] as const)` for closed string sets. Examples: colors, code languages, and block
  types.
- Use `z.iso.datetime()` for date-time values. Use `z.uuid()` for UUIDs. Use `z.url()` for URLs.
- Use generic schema factories for patterns that repeat. Example: `paginatedListSchema(resultSchema)`.

### API Modules (`src/api/`)

- All API classes extend `BaseAPI<TResponse, TModel>` in `base.api.ts`. This base class holds
  `protected readonly client: NotionClient`. It provides these methods: `retrieveResource`,
  `createResource`, `updateResource`, `deleteResource`, `listResources`, `parseAndWrap`, and
  `parsePaginatedList`.
- Each constructor calls `super(client)`.
- Each method is `async`. Each method takes a typed options interface. Each method returns a
  model instance.
- The request flow has 5 steps:
  1. Validate the inputs.
  2. Build the request body.
  3. Call `this.client.request<T>()`.
  4. Parse the response with Zod.
  5. Wrap the result in a model.
- Client-side validation runs before the request. It uses `validateArrayLength()` and
  `validateStringLength()`.
- Paginated responses use `paginatedListSchema(itemSchema)`. This schema maps each result through
  a model constructor.
- Convenience methods wrap common patterns. Example: `trash(id)` calls
  `update(id, { in_trash: true })`.
- Sub-resources use object literals with arrow functions. Example:
  `readonly children = { list: async (...) => {...} }`.
- Add JSDoc comments with `@param`, `@returns`, and `@see` tags. The `@see` tag links to the
  Notion API documentation.

### Models (`src/models/`)

- Extend the abstract class `BaseModel<T>`. Its constructor takes `data` and a `schema`. It
  validates the data with `schema.parse(data)` on construction.
- The `toJSON(): T` method makes a deep clone with `structuredClone(this.data)`.
- Define 2 abstract getters: `object` and `id`.
- Expose data as getter properties. Convert snake_case API fields to camelCase.
- Getters convert date-time strings to `Date` objects.
- Use boolean methods for type checks. Examples: `isTextBlock()`, `isPerson()`, and
  `isInDatabase()`.
- Use text extraction methods. Examples: `getPlainText()` and `getTitle()`.

### Helpers (`src/helpers/`)

- Export helpers as namespace objects: `block`, `richText`, `filter`, `sort`, `prop`, `parent`,
  `icon`, `cover`, `notionFile`, and `webhook`.
- `richText` uses `Object.assign(createFn, { mentionPage, mentionDatabase, ... })`. This makes
  `richText` callable and gives it static methods.
- `RichTextBuilder` provides a chainable API. The `.build()` method produces a `NotionRichText`.
- All text-accepting helpers accept the `RichTextInput` union:
  `string | RichTextBuilder | NotionRichText`. Each helper resolves this input with
  `resolveRichText()`.
- Helpers validate inputs immediately. They use `validateStringLength()` and
  `validateArrayLength()`. They throw `NotionValidationError` before any API call.
- Filter helpers return builders with chainable methods. Each builder produces a
  `FilterCondition`. Compound filters use `filter.and()` and `filter.or()`.
- Sort helpers return builders. Each builder has 2 terminal methods: `.ascending()` and
  `.descending()`.
- Pagination helpers automate cursor-based pagination for Notion list endpoints: `paginate`,
  `paginateIterator`, and `paginateWithMetadata`. Notion limits each query to 10,000 results.
  `iterateAllDataSourceRows` and `collectAllDataSourceRows` work around this limit by splitting
  the query into `created_time` windows. See `request_status` in `pagination.schema.ts` for more
  information.

### Error Handling (`src/errors.ts`, `src/validation.ts`)

The SDK has 4 error classes. Each class extends `Error` and sets `this.name`:

- `NotionAPIError`: an HTTP error response. It has these properties: `status`, `code`, `body`,
  and `retryAfterMs`. It has these helper methods: `isRateLimited()`, `isServiceOverloaded()`,
  `isNotFound()`, `isUnauthorized()`, `isValidationError()`, `isServerError()`,
  `isRestrictedResource()`, and `isRetryable()`.
- `NotionNetworkError`: a connectivity failure. It has an optional `cause` property.
- `NotionRequestTimeoutError`: the request exceeded the timeout.
- `NotionValidationError`: a client-side size limit violation. The SDK throws this error before it
  sends the request.

The client retries 2 error types. It retries `rate_limited` errors, HTTP status 429, when
`retryOnRateLimit` is enabled. It always retries `service_overload` errors, HTTP status 529. The
client uses the `Retry-After` header when the header is present. Otherwise, the client uses
exponential backoff: `2^attempt * 1000ms`, capped at 60 seconds.

The `LIMITS` constant in `validation.ts` defines client-side size limits. The SDK enforces these
limits before it sends a request. Limit categories:

- Rich text
- URLs
- Email and phone
- Multi-select, relation, and people arrays
- Comment attachments
- Payload blocks and bytes

Read `validation.ts` for the exact values. Do not rely on this document for exact values.
