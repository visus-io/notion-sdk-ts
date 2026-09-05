import * as z from 'zod';
import { fileSchema } from './file.schema';
import { iconSchema } from './icon.schema';
import { parentSchema } from './parent.schema';
import { richTextSchema } from './richText.schema';
import { notionDateStringSchema } from './shared.schema';
import { userSchema } from './user.schema';

/**
 * Notion database object schema.
 *
 * Databases are collections of pages with a defined schema. As of API version 2025-09-03,
 * databases contain one or more data sources (individual tables).
 *
 * Notion API reference:
 * https://developers.notion.com/reference/database
 */

/** Data source reference with id and name.
 *
 * @category Databases & Data Sources
 */
export const dataSourceRefSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
});

/**
 * @category Databases & Data Sources
 */
export type DataSourceRef = z.infer<typeof dataSourceRefSchema>;

/**
 * A canonical database type.
 *
 * Pass one of these values as `database_type` when you create a database. Notion builds the
 * database from its schema for that type, not a custom schema.
 *
 * @category Databases & Data Sources
 */
export const DATABASE_TYPES = ['tasks', 'projects', 'skills'] as const;

/**
 * @category Databases & Data Sources
 */
export type DatabaseType = (typeof DATABASE_TYPES)[number];

/**
 * @category Databases & Data Sources
 */
export const databaseSchema = z.object({
  object: z.literal('database'),
  id: z.uuid(),
  data_sources: z.array(dataSourceRefSchema),
  created_time: notionDateStringSchema,
  created_by: userSchema,
  last_edited_time: notionDateStringSchema,
  last_edited_by: userSchema,
  title: richTextSchema,
  description: richTextSchema,
  icon: z.nullable(iconSchema),
  cover: z.nullable(fileSchema),
  parent: parentSchema,
  url: z.url(),
  in_trash: z.boolean(),
  is_inline: z.boolean(),
  is_locked: z.boolean().optional(),
  public_url: z.nullable(z.url()),
  database_type: z.enum(DATABASE_TYPES).optional(),
});

/**
 * @category Databases & Data Sources
 */
export type NotionDatabase = z.infer<typeof databaseSchema>;
