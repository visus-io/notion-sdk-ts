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
 * In API version 2025-09-03, both data_source_id and database_id are required
 * when creating a page with a data source parent.
 *
 * @example
 * ```ts
 * // Get database info first
 * const db = await notion.databases.retrieve('database-id');
 * const dsId = db.dataSources[0].id;
 *
 * // Create page with data source parent
 * parent.dataSource(dsId, db.id)
 * ```
 */
function dataSource(
  dataSourceId: string,
  databaseId: string,
): { data_source_id: string; database_id: string } {
  return { data_source_id: dataSourceId, database_id: databaseId };
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
