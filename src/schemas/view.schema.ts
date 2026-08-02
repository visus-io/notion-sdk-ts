import * as z from 'zod';
import { databaseParentSchema } from './parent.schema';
import { pageSchema } from './page.schema';
import { requestStatusSchema } from './pagination.schema';
import { notionDateStringSchema } from './shared.schema';
import { userSchema } from './user.schema';

/**
 * View object schema.
 *
 * A view controls how a database or data source displays its rows, for example as a
 * table, board, or calendar. As of API version 2025-09-03, views have their own
 * endpoints.
 *
 * Notion API reference:
 * https://developers.notion.com/guides/data-apis/working-with-views
 *
 * @category Views
 */

export const VIEW_TYPES = [
  'table',
  'board',
  'list',
  'calendar',
  'timeline',
  'gallery',
  'form',
  'chart',
  'map',
  'dashboard',
] as const;
/**
 * @category Views
 */
export type ViewType = (typeof VIEW_TYPES)[number];

/**
 * Configuration for a single view layout.
 *
 * Notion has not confirmed the exact fields for each view type against a live
 * response. Examples include the table column order and the board group-by
 * property. This schema stays permissive. It tags the object by its `type`
 * field and passes all other fields through without validation. As a result,
 * unknown fields round-trip unchanged instead of the schema rejecting them.
 *
 * @category Views
 */
export const viewConfigurationSchema = z
  .object({
    type: z.enum(VIEW_TYPES),
  })
  .catchall(z.unknown());
/**
 * @category Views
 */
export type ViewConfiguration = z.infer<typeof viewConfigurationSchema>;

/**
 * @category Views
 */
export const viewSchema = z.object({
  object: z.literal('view'),
  id: z.uuid(),
  parent: databaseParentSchema,
  data_source_id: z.uuid().nullable(),
  name: z.string().trim(),
  type: z.enum(VIEW_TYPES),
  filter: z.record(z.string(), z.unknown()).nullish(),
  sorts: z.array(z.record(z.string(), z.unknown())).nullish(),
  quick_filters: z.record(z.string(), z.unknown()).nullish(),
  configuration: viewConfigurationSchema.optional(),
  created_time: notionDateStringSchema,
  last_edited_time: notionDateStringSchema,
  created_by: userSchema,
  last_edited_by: userSchema,
  url: z.url(),
  // Widget/dashboard views only.
  dashboard_view_id: z.uuid().optional(),
});
/**
 * @category Views
 */
export type NotionView = z.infer<typeof viewSchema>;

/**
 * Notion's delete-view response includes only `object`, `id`, `parent`, and `type`.
 * It omits the rest of the view shape.
 *
 * @category Views
 */
export const viewDeleteResponseSchema = z.object({
  object: z.literal('view'),
  id: z.uuid(),
  parent: databaseParentSchema,
  type: z.enum(VIEW_TYPES),
});
/**
 * @category Views
 */
export type ViewDeleteResult = z.infer<typeof viewDeleteResponseSchema>;

/**
 * View query response schema. This response has a non-standard pagination shape:
 * `object: "view_query"`, plus `expires_at` and `total_count`. Queries expire
 * about 15 minutes after creation.
 *
 * @category Views
 */
export const viewQueryResponseSchema = z.object({
  object: z.literal('view_query'),
  id: z.uuid(),
  view_id: z.uuid(),
  expires_at: notionDateStringSchema,
  total_count: z.number(),
  results: z.array(pageSchema),
  next_cursor: z.string().trim().nullable(),
  has_more: z.boolean(),
  request_status: requestStatusSchema.optional(),
});
/**
 * @category Views
 */
export type ViewQueryResponse = z.infer<typeof viewQueryResponseSchema>;
