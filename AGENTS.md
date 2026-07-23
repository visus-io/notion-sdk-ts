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
- Model tests construct with realistic mock data matching full Notion API response shapes and assert getters/methods.
- Helper tests call factory functions and assert plain-object output with `toEqual()`.
- Client tests mock `fetch` via `vi.fn()` injected through `NotionClientOptions.fetch`; use `vi.useFakeTimers()` for retry tests; use `expect.unreachable()` on expected-throw paths.
- Validation tests use `expect(() => ...).toThrow(ErrorClass | /pattern/)` and include boundary cases (at limit, over limit).
- No external mocking libraries -- only Vitest's built-in `vi`.

## Git Workflow

- Husky `pre-commit` runs `lint-staged`; `commit-msg` runs `commitlint`; `post-checkout` runs `bun install` when `package.json`/`bun.lock` change on branch switch.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- `lint-staged` auto-fixes/formats `.ts`, `.json`, `.md`, `.yml`, `.yaml` on commit.

## Linting

Rules live in `eslint.config.mjs` (`tseslint.configs.recommendedTypeChecked` + `eslint-plugin-zod`) -- follow it exactly rather than relying on this list, which only calls out thresholds that aren't obvious from a passing lint run:

- `complexity` max 15, `max-depth` 4, `max-lines-per-function` 150.
- `no-console` only allows `console.warn` / `console.error`.
- No `.js` extensions in import/export paths.

## What NOT to Do

- No default exports anywhere -- named exports only.
- No TypeScript `enum` -- use `as const` arrays and derive types (`type Thing = (typeof THING)[number]`).
- No `.js` extensions in import/export paths.
- Avoid `any` (use `unknown` when the type is truly unknown) and `!` non-null assertions.
- Don't override or hardcode a different Notion API version -- it's fixed at `2026-03-11`.
- Don't skip client-side validation (`validateStringLength()` / `validateArrayLength()`) before an API call that accepts user input.
