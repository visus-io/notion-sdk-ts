import { z } from 'zod';
import { emojiSchema } from './emoji.schema';
import { fileSchema } from './file.schema';
import { parentSchema } from './parent.schema';
import { richTextSchema } from './richText.schema';
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

/** Data source reference with id and name. */
export const dataSourceRefSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export type DataSourceRef = z.infer<typeof dataSourceRefSchema>;

export const databaseSchema = z.object({
  object: z.literal('database'),
  id: z.uuid(),
  data_sources: z.array(dataSourceRefSchema),
  created_time: z.iso.datetime(),
  created_by: userSchema,
  last_edited_time: z.iso.datetime(),
  last_edited_by: userSchema,
  title: richTextSchema,
  description: richTextSchema,
  icon: z.nullable(z.union([fileSchema, emojiSchema])),
  cover: z.nullable(fileSchema),
  parent: parentSchema,
  url: z.url(),
  archived: z.boolean(),
  in_trash: z.boolean(),
  is_inline: z.boolean(),
  public_url: z.nullable(z.url()),
});

export type NotionDatabase = z.infer<typeof databaseSchema>;
