import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightTypeDoc from 'starlight-typedoc';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, '../src');
const apiContentDir = path.resolve(here, 'src/content/docs/api');

// Domain-oriented sidebar order for the generated API reference. TypeDoc's default
// grouping is purely by TS kind (Classes, Type Aliases, Variables, ...), which for this
// SDK dumps 100+ type-aliases and 50+ variables into single flat, alphabetical lists.
// Categories are declared via `@category` JSDoc tags on exported symbols in `src/` and
// read back here to build an explicit, domain-grouped sidebar instead.
const CATEGORY_ORDER = [
  'Client & Core',
  'Errors',
  'Pages',
  'Page Properties',
  'Blocks',
  'Databases & Data Sources',
  'Rich Text',
  'Users',
  'Comments',
  'File Uploads',
  'Views',
  'Async Tasks',
  'Custom Emoji & Icons',
  'Search',
  'Helpers',
  'Pagination',
  'Shared Types',
];

// Allows for lines like `// eslint-disable-next-line ...` between the JSDoc block and the
// export it documents (e.g. `paginatedListSchema`, which needs a disable comment immediately
// above the export for its inferred-vs-explicit return type).
const CATEGORY_TAG_RE =
  /@category\s+([^\n]+?)\s*\n\s*\*\/\s*\n(?:\s*\/\/[^\n]*\n)*\s*export\s+(?:abstract\s+)?(?:async\s+)?(?:class|interface|type|const|function\*?)\s+([A-Za-z0-9_]+)/g;

function collectCategories(dir, map = new Map()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'testUtils' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectCategories(full, map);
      continue;
    }
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue;

    const text = readFileSync(full, 'utf8');
    for (const match of text.matchAll(CATEGORY_TAG_RE)) {
      map.set(match[2], match[1].trim());
    }
  }
  return map;
}

function collectApiPages(dir, baseDir = dir, pages = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectApiPages(full, baseDir, pages);
      continue;
    }
    if (!entry.name.endsWith('.md')) continue;

    const relative = path.relative(baseDir, full);
    if (relative === 'index.md') continue;

    const text = readFileSync(full, 'utf8');
    const titleMatch = text.match(/^title:\s*"?([^"\n]+)"?\s*$/m);
    if (!titleMatch) continue;

    const link = `/api/${relative.slice(0, -3).toLowerCase().split(path.sep).join('/')}/`;
    pages.push({ name: titleMatch[1].trim(), link });
  }
  return pages;
}

function buildApiReferenceSidebar() {
  const categories = collectCategories(srcDir);
  let pages;
  try {
    pages = collectApiPages(apiContentDir);
  } catch {
    // First run before starlight-typedoc has generated any output (e.g. `astro sync`
    // before the first `astro dev`/`astro build`); fall back to just the overview link.
    return [{ label: 'Overview', link: '/api/' }];
  }

  const grouped = new Map();
  for (const page of pages) {
    const category = categories.get(page.name) ?? 'Other';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(page);
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((category) => grouped.has(category)),
    ...[...grouped.keys()].filter((category) => !CATEGORY_ORDER.includes(category)).sort(),
  ];

  return [
    { label: 'Overview', link: '/api/' },
    ...orderedCategories.map((category) => ({
      label: category,
      collapsed: true,
      items: grouped
        .get(category)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((page) => ({ label: page.name, link: page.link })),
    })),
  ];
}

function apiReferenceSidebar() {
  return {
    name: 'api-reference-sidebar',
    hooks: {
      'config:setup'({ config, updateConfig }) {
        const sidebar = (config.sidebar ?? []).map((item) =>
          item && typeof item === 'object' && item.label === 'API Reference'
            ? { ...item, items: buildApiReferenceSidebar() }
            : item,
        );
        updateConfig({ sidebar });
      },
    },
  };
}

export default defineConfig({
  site: 'https://nts.projects.visus.io',
  security: {
    csp: {
      // Starlight ships these scripts with `is:inline`, so Astro's CSP feature can't see or
      // hash their content automatically -- they're allowlisted here by hash instead. Recompute
      // by scanning `docs/dist/**/*.html` for `script-src` violations after a Starlight upgrade.
      scriptDirective: {
        hashes: [
          'sha256-VWo5Wp4aqSj6nSgMpeAp9cKieaoIfwFUAunAVugI5gA=',
          'sha256-f/zAUE74ucc3JYp4r4QQvkJofoQdkOIhHYK+jeZ6eko=',
          'sha256-GkZBRnvSuhtx/cvzvukVkX2JJZW+DdPlVr7BX8Tefqo=',
          'sha256-wX2yOADeV+NMngflD5uYi3vl50SHC4sfM1EmylVjlX4=',
          'sha256-7eCV4jtsr4t4knb3c4FCRPeu7GGZeOUGE3XvWix0XOQ=',
        ],
      },
    },
  },
  integrations: [
    starlight({
      title: '@visus-io/notion-sdk-ts',
      description: 'A type-safe TypeScript SDK for the Notion API',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/visus-io/notion-sdk-ts' },
      ],
      editLink: {
        baseUrl: 'https://github.com/visus-io/notion-sdk-ts/edit/main/docs/',
      },
      components: {
        Head: './src/components/Head.astro',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: ['getting-started', 'migration-guide'],
        },
        {
          label: 'Guides',
          items: [{ autogenerate: { directory: 'guides' } }],
        },
        {
          label: 'API Reference',
          collapsed: false,
          items: [],
        },
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: ['../src/index.ts'],
          tsconfig: '../tsconfig.json',
          watch: process.env.NODE_ENV !== 'production',
          typeDoc: {
            entryFileName: 'index.md',
          },
        }),
        apiReferenceSidebar(),
      ],
    }),
  ],
});
