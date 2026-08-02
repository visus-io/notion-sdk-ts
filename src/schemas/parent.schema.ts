import * as z from 'zod';

/**
 * Notion parent object schemas.
 *
 * Parent objects identify the container of a page or block within Notion.
 * A parent can be a database, data source, page, workspace, or block.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/parent-object
 */

/** Database parent.
 *
 * @category Shared Types
 */
export const databaseParentSchema = z.object({
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

/** Agent parent. */
const agentParentSchema = z.object({
  type: z.literal('agent_id'),
  agent_id: z.uuid(),
});

/**
 * @category Shared Types
 */
export const parentSchema = z.discriminatedUnion('type', [
  databaseParentSchema,
  dataSourceParentSchema,
  pageParentSchema,
  workspaceParentSchema,
  blockParentSchema,
  agentParentSchema,
]);

/**
 * @category Shared Types
 */
export type NotionParent = z.infer<typeof parentSchema>;
/**
 * @category Shared Types
 */
export type DatabaseParent = z.infer<typeof databaseParentSchema>;
/**
 * @category Shared Types
 */
export type DataSourceParent = z.infer<typeof dataSourceParentSchema>;
/**
 * @category Shared Types
 */
export type PageParent = z.infer<typeof pageParentSchema>;
/**
 * @category Shared Types
 */
export type WorkspaceParent = z.infer<typeof workspaceParentSchema>;
/**
 * @category Shared Types
 */
export type BlockParent = z.infer<typeof blockParentSchema>;
/**
 * @category Shared Types
 */
export type AgentParent = z.infer<typeof agentParentSchema>;
