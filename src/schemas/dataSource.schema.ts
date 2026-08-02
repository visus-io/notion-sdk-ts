import * as z from 'zod';
import { fileSchema } from './file.schema';
import { iconSchema } from './icon.schema';
import { parentSchema } from './parent.schema';
import { richTextSchema } from './richText.schema';
import { notionDateStringSchema } from './shared.schema';
import { userSchema } from './user.schema';
import { propertiesObjectSchema } from './propertyObjects.schema';

/**
 * Notion data source object schema.
 *
 * Data sources are individual tables of data that live under a Notion database.
 * As of API version 2025-09-03, data sources have their own API endpoints.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/data-source
 */
export const dataSourceSchema = z.object({
  /** Always "data_source" */
  object: z.literal('data_source'),

  /** Unique identifier for the data source */
  id: z.uuid(),

  /** Schema of properties for the data source as they appear in Notion */
  properties: propertiesObjectSchema,

  /** Information about the data source's parent database */
  parent: parentSchema,

  /** Information about the database's parent (the data source's grandparent) */
  database_parent: parentSchema,

  /** Date and time when this data source was created (ISO 8601) */
  created_time: notionDateStringSchema,

  /** User who created the data source */
  created_by: userSchema,

  /** Date and time when this data source was updated (ISO 8601) */
  last_edited_time: notionDateStringSchema,

  /** User who last edited the data source */
  last_edited_by: userSchema,

  /** Name of the data source as it appears in Notion */
  title: richTextSchema,

  /** Description of the data source as it appears in Notion */
  description: richTextSchema,

  /** Data source icon (File, Emoji, Native Icon, or Custom Emoji object) */
  icon: iconSchema.nullable(),

  /** Data source cover image */
  cover: fileSchema.nullable(),

  /** The Notion URL of the data source */
  url: z.url(),

  /** The public URL if published, otherwise null */
  public_url: z.union([z.url(), z.null()]),

  /** Whether the data source is inline */
  is_inline: z.boolean(),

  /** Whether the data source is in the trash */
  in_trash: z.boolean(),
});

export type NotionDataSource = z.infer<typeof dataSourceSchema>;

/**
 * A single data source template reference, as returned by the
 * List data source templates endpoint.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/list-data-source-templates
 */
export const dataSourceTemplateSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
  is_default: z.boolean(),
});

export type DataSourceTemplate = z.infer<typeof dataSourceTemplateSchema>;

/** Response shape of the List data source templates endpoint. */
export const dataSourceTemplateListSchema = z.object({
  templates: z.array(dataSourceTemplateSchema),
  has_more: z.boolean(),
  next_cursor: z.string().trim().nullable(),
});

export type DataSourceTemplateList = z.infer<typeof dataSourceTemplateListSchema>;
