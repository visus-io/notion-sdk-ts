// ---------------------------------------------------------------------------
// Parent object helpers
// ---------------------------------------------------------------------------

/**
 * Create a page parent object.
 *
 * @example
 * ```ts
 * parent.page('page-id')
 * ```
 */
function page(pageId: string): { page_id: string } {
  return { page_id: pageId };
}

/**
 * Create a database parent object.
 *
 * @example
 * ```ts
 * parent.database('database-id')
 * ```
 */
function database(databaseId: string): { database_id: string } {
  return { database_id: databaseId };
}

/**
 * Create a data source parent object.
 *
 * @example
 * ```ts
 * parent.dataSource('data-source-id')
 * ```
 */
function dataSource(dataSourceId: string): { data_source_id: string } {
  return { data_source_id: dataSourceId };
}

/**
 * Create a workspace parent object.
 *
 * @example
 * ```ts
 * parent.workspace()
 * ```
 */
function workspace(): { workspace: true } {
  return { workspace: true as const };
}

/**
 * Create a block parent object (used for comments on blocks).
 *
 * @example
 * ```ts
 * parent.block('block-id')
 * ```
 */
function blockParent(blockId: string): { block_id: string } {
  return { block_id: blockId };
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Helpers for constructing parent objects for Notion API create operations.
 *
 * @example
 * ```ts
 * import { parent } from '@visus-io/notion-sdk-ts';
 *
 * // Create a page in a database
 * notion.pages.create({
 *   parent: parent.database('db-id'),
 *   properties: { ... },
 * });
 *
 * // Create a database under a page
 * notion.databases.create({
 *   parent: parent.page('page-id'),
 *   properties: { ... },
 * });
 *
 * // Create a comment on a block
 * notion.comments.create({
 *   parent: parent.block('block-id'),
 *   rich_text: [...],
 * });
 * ```
 */
export const parent = {
  page,
  database,
  dataSource,
  workspace,
  block: blockParent,
};
