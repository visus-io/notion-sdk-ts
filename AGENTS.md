<!-- architecture -->

@ARCHITECTURE.md
<!-- architecture -->

# Agent Instructions

## Commands

```bash
bun run build            # Compile TypeScript to dist/ via tsc
bun run test             # Run tests with Vitest
bun run test:watch       # Run tests in watch mode
bun run test:coverage    # Run tests with v8 coverage
bun run lint             # Lint with ESLint
bun run lint:fix         # Lint and auto-fix
bun run lint:html        # Lint and output HTML report to reports/
bun run lint:json        # Lint and output JSON report to reports/
bun run format           # Format with Prettier
bun run format:check     # Check formatting
```

## Coding Conventions

- **File naming:** `camelCase` with a domain suffix (`block.schema.ts`, `block.model.ts`, `block.helpers.ts`). API modules use plural nouns (`blocks.api.ts`, `fileUploads.api.ts`). Tests are `*.test.ts` colocated with source.
- **Classes/Interfaces/Types:** PascalCase (`Block`, `NotionClient`, `BlocksAPI`, `CreatePageOptions`).
- **Constants:** UPPER_SNAKE_CASE (`LIMITS`, `NOTION_COLORS`).
- **Functions/variables:** camelCase (`validateStringLength`, `resolveRichText`).
- **Exported namespace objects:** camelCase (`block`, `richText`, `filter`, `sort`, `prop`, `parent`, `icon`, `cover`, `notionFile`).
- **Type-only imports:** always `import type { X }` (enforced by `consistent-type-imports`); mixing with value imports on one line is fine.
- Each subdirectory has a barrel `index.ts`; `src/index.ts` re-exports everything.
- Prettier: single quotes, semicolons, trailing commas, 100 char width, 2-space indent, no tabs. `prettier-plugin-packagejson` sorts `package.json` fields.
- TypeScript: target ES2021, module CommonJS, strict mode. Declaration maps and source maps disabled. Use numeric separators for readability (`2_000`, `500 * 1_024`). Prefix unused parameters with `_`.

## Testing Conventions

- Vitest with `globals: true`; tests still explicitly `import { describe, expect, it } from 'vitest'`. Environment: Node.
- Structure: top-level `describe()` per module/class, nested `describe()` for groups, `it('should ...')` per case. Dash-comment dividers (`// -------...`) separate logical test groups.
- **`src/api/` endpoints get two tiers of coverage; prefer the integration tier.** Each API module has both `*.api.integration.test.ts` (MSW-backed, drives the real `Notion` facade -> `NotionClient` -> `fetch` stack via `useMswServer()`/`server` from `src/testUtils/mswServer.ts`, fixtures from `src/testUtils/fixtures.ts`) and `*.api.test.ts` (unit, `fetch` mocked via `vi.fn()`). The integration tier is the primary signal for a new or changed endpoint -- it's the only one that actually exercises URL construction, header/query/body serialization, and response parsing over real HTTP, which a mocked-`fetch` unit test cannot catch by construction. Add an integration happy-path test (plus an error-path case if the module doesn't already cover that failure shape) for every new/changed method. Use the unit tier for what integration tests are impractical for: exhaustive per-option/per-branch combinations, client-side validation-error paths, and other cases that would be noisy to re-express as MSW handlers. When both apply to a change, add both -- don't let one substitute for the other.
- Model tests construct with realistic mock data matching full Notion API response shapes and assert getters/methods.
- Helper tests call factory functions and assert plain-object output with `toEqual()`.
- Client tests mock `fetch` via `vi.fn()` injected through `NotionClientOptions.fetch`; use `vi.useFakeTimers()` for retry tests; use `expect.unreachable()` on expected-throw paths.
- Validation tests use `expect(() => ...).toThrow(ErrorClass | /pattern/)` and include boundary cases (at limit, over limit).
- No external mocking libraries for unit tests -- only Vitest's built-in `vi`. Integration tests use `msw` to intercept HTTP at the network layer (not to mock arbitrary modules).

## Documentation Style

All documentation and JSDoc comments **must** follow the ASD-STE100 (Simplified Technical
English) standard. This applies to Markdown docs (`README.md`, `ARCHITECTURE.md`, `AGENTS.md`,
`docs/`) and to JSDoc comments in source. Key rules:

- Write short sentences. Target 20 words or fewer per sentence.
- Write one instruction or one fact per sentence.
- Use active voice. Use simple tenses: simple present, simple past, or imperative.
- Address the reader directly with imperative mood for instructions (e.g. "Call `retrieve()`
  first," not "The `retrieve()` method should be called first").
- Avoid noun clusters (chains of 3+ nouns strung together). Avoid gerunds as nouns when a
  verb form reads clearer.
- Use each term consistently. Do not use a synonym for a term already used elsewhere in the same
  document.
- Avoid vague qualifiers ("relatively", "fairly", "quite"). State the exact behavior or value.

**Documentation must stay in sync with the code.** If a change adds, removes, or changes the
behavior of a public API (a method, an option, a return value, an error, a default), update the
matching JSDoc and any affected Markdown docs (`README.md`, `ARCHITECTURE.md`, `docs/`) in the
same change. Do not defer doc updates to a later commit.

## Git Workflow

- Husky `pre-commit` runs `lint-staged`; `commit-msg` runs `commitlint`; `post-checkout` runs `bun install` when `package.json`/`bun.lock` change on branch switch.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- `lint-staged` auto-fixes/formats `.ts`, `.json`, `.md`, `.yml`, `.yaml` on commit.

## Linting

Rules live in `eslint.config.mjs` (`tseslint.configs.recommendedTypeChecked` + `eslint-plugin-zod`) -- follow it exactly rather than relying on this list, which only calls out thresholds that aren't obvious from a passing lint run:

- `complexity` max 15, `max-depth` 4, `max-lines-per-function` 150.
- `no-console` only allows `console.warn` / `console.error`.
- No `.js` extensions in import/export paths.

## YAML and Workflow Files

- Before finishing any change that touches a `.yml`/`.yaml` file, check whether `yamllint` is available (`command -v yamllint`) and, if so, run it against the changed file(s) (config lives at `.yamllint.yml`). Skip silently only if the tool is not installed.
- If the changed `.yml` file is a GitHub Actions workflow under `.github/workflows/`, additionally check whether `actionlint` is available (`command -v actionlint`) and, if so, run it against the changed file(s). Skip silently only if the tool is not installed.

## Docs Site (`docs/`)

`docs/astro.config.mjs` hardcodes 5 script hashes in `security.csp.scriptDirective.hashes`.
These hashes allow Starlight's `is:inline` scripts to run under the site's Content Security
Policy. Astro's CSP feature cannot hash `is:inline` scripts automatically.

If `docs/package.json` bumps the `@astrojs/starlight` version, recompute these hashes. Run
`bun run --cwd docs build`, then scan `docs/dist/**/*.html` for inline `<script>` tags whose
content hash is missing from that page's `script-src` list. Replace the `hashes` array in
`docs/astro.config.mjs` with the new set and rebuild to confirm zero violations remain across
all pages. A stale hash silently blocks the matching script at runtime; it does not fail the
build. Affected features include search, the theme picker, and sidebar and table-of-contents
state.

## What NOT to Do

- No default exports anywhere -- named exports only.
- No TypeScript `enum` -- use `as const` arrays and derive types (`type Thing = (typeof THING)[number]`).
- No `.js` extensions in import/export paths.
- Avoid `any` (use `unknown` when the type is truly unknown) and `!` non-null assertions.
- Don't override or hardcode a different Notion API version -- it's fixed at `2026-03-11`.
- Don't skip client-side validation (`validateStringLength()` / `validateArrayLength()`) before an API call that accepts user input.
- Don't upgrade `@astrojs/starlight` in `docs/` without recomputing the CSP script hashes in `docs/astro.config.mjs` (see "Docs Site" above).
