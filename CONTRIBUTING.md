# Contributing to @visus-io/notion-sdk-ts

Thanks for your interest in contributing! This guide covers the mechanics of submitting a
change. For coding conventions, testing conventions, and architecture, see
[AGENTS.md](./AGENTS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md) — they're the source of truth
this project follows.

## Getting Started

This project uses [Bun](https://bun.sh) as its package manager.

```bash
git clone https://github.com/visus-io/notion-sdk-ts.git
cd notion-sdk-ts
bun install
```

## Making a Change

1. Create a branch off `main`:

   ```bash
   git checkout -b feature/my-change
   ```

2. Make your change, following the conventions in [AGENTS.md](./AGENTS.md) (file naming, exports,
   validation, testing patterns, etc.).
3. Add or update tests. `src/api/` endpoints require both an integration test
   (`*.api.integration.test.ts`, MSW-backed) and a unit test (`*.api.test.ts`) — see AGENTS.md's
   Testing Conventions for when each applies.
4. If you add or move an exported symbol in `src/`, tag it with an `@category` JSDoc comment
   matching one of the existing categories in `docs/astro.config.mjs` (or a new one) — the
   generated API reference sidebar is built from these tags.
5. Run the checks locally:

   ```bash
   bun run lint
   bun run format
   bun run test
   bun run build
   ```

## Commit Messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`,
`fix:`, `chore:`, `refactor:`, `docs:`, `test:`, ...) — enforced by commitlint via a Husky
`commit-msg` hook. A `pre-commit` hook also runs `lint-staged`, auto-fixing/formatting staged
`.ts`, `.json`, `.md`, `.yml`, and `.yaml` files.

## Submitting a Pull Request

Push your branch and open a PR against `main`. The PR template walks you through a checklist
covering tests, lint, and documentation updates.

## Documentation

- Narrative guides and the generated API reference live in [`docs/`](./docs) (Starlight +
  TypeDoc). Run `bun run docs:dev` to preview changes locally.
- Update the relevant guide under `docs/src/content/docs/guides/` if your change affects
  documented behavior.
- Public API changes are documented automatically via JSDoc comments in `src/` — there's no
  separate reference page to hand-edit.

## Areas for Contribution

- Bug fixes
- New helper functions
- Additional guide content or examples
- Performance improvements
- Test coverage improvements

## Questions?

Open an issue or start a discussion on [GitHub](https://github.com/visus-io/notion-sdk-ts).
