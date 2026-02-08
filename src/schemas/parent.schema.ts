import { z } from 'zod';

/**
 * Notion parent object schemas.
 *
 * Parent objects define the location/container of pages and blocks within Notion.
 * A parent can be a database, data source, page, workspace, or block.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/parent-object
 */

/** Database parent. */
const databaseParentSchema = z.object({
  type: z.literal('database_id'),
  database_id: z.uuid(),
});

/** Data source parent. */
const dataSourceParentSchema = z.object({
  type: z.literal('data_source_id'),
  data_source_id: z.uuid(),
  database_id: z.uuid(),
});

/** Page parent. */
const pageParentSchema = z.object({
  type: z.literal('page_id'),
  page_id: z.uuid(),
});

/** Workspace parent. */
const workspaceParentSchema = z.object({
  type: z.literal('workspace'),
  workspace: z.literal(true),
});

/** Block parent. */
const blockParentSchema = z.object({
  type: z.literal('block_id'),
  block_id: z.uuid(),
});

export const parentSchema = z.discriminatedUnion('type', [
  databaseParentSchema,
  dataSourceParentSchema,
  pageParentSchema,
  workspaceParentSchema,
  blockParentSchema,
]);

export type NotionParent = z.infer<typeof parentSchema>;
export type DatabaseParent = z.infer<typeof databaseParentSchema>;
export type DataSourceParent = z.infer<typeof dataSourceParentSchema>;
export type PageParent = z.infer<typeof pageParentSchema>;
export type WorkspaceParent = z.infer<typeof workspaceParentSchema>;
export type BlockParent = z.infer<typeof blockParentSchema>;
