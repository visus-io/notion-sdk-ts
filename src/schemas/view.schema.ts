import * as z from 'zod';
import { databaseParentSchema } from './parent.schema';
import { pageSchema } from './page.schema';
import { requestStatusSchema } from './pagination.schema';
import { notionDateStringSchema } from './shared.schema';
import { userSchema } from './user.schema';

/**
 * View object schema.
 *
 * Views control how a database/data source's rows are displayed (table, board,
 * calendar, etc.). As of API version 2025-09-03, views have their own endpoints.
 *
 * Notion API reference:
 * https://developers.notion.com/guides/data-apis/working-with-views
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
export type ViewType = (typeof VIEW_TYPES)[number];

/**
 * Per-layout view configuration. Exact per-type fields (e.g. table column order, board
 * group-by property) haven't been confirmed against a live response, so this is kept
 * permissive -- tagged on `type`, with all other fields passed through unmodeled -- so
 * unknown fields round-trip instead of being stripped or rejected.
 */
export const viewConfigurationSchema = z
  .object({
    type: z.enum(VIEW_TYPES),
  })
  .catchall(z.unknown());
export type ViewConfiguration = z.infer<typeof viewConfigurationSchema>;

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
export type NotionView = z.infer<typeof viewSchema>;

/** Delete-a-view returns a partial object: only object/id/parent/type. */
export const viewDeleteResponseSchema = z.object({
  object: z.literal('view'),
  id: z.uuid(),
  parent: databaseParentSchema,
  type: z.enum(VIEW_TYPES),
});
export type ViewDeleteResult = z.infer<typeof viewDeleteResponseSchema>;

/**
 * View query response schema. Non-standard pagination shape: `object: "view_query"`,
 * plus `expires_at`/`total_count`; queries expire roughly 15 minutes after creation.
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
export type ViewQueryResponse = z.infer<typeof viewQueryResponseSchema>;
