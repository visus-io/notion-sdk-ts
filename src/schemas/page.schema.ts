import * as z from 'zod';
import { emojiSchema } from './emoji.schema';
import { fileSchema } from './file.schema';
import { pagePropertiesSchema } from './pageProperties.schema';
import { parentSchema } from './parent.schema';
import { notionDateStringSchema } from './shared.schema';
import { userSchema } from './user.schema';

/**
 * Notion page object schema.
 *
 * Pages are the primary content containers in Notion. They contain properties
 * (data stored in database columns) and content (blocks).
 *
 * Notion API reference:
 * https://developers.notion.com/reference/page
 */

export const pageSchema = z.object({
  object: z.literal('page'),
  id: z.uuid(),
  created_time: notionDateStringSchema,
  created_by: userSchema,
  last_edited_time: notionDateStringSchema,
  last_edited_by: userSchema,
  archived: z.boolean(),
  in_trash: z.boolean(),
  icon: z.nullable(z.union([fileSchema, emojiSchema])),
  cover: z.nullable(fileSchema),
  properties: z.record(z.string().trim(), pagePropertiesSchema),
  parent: parentSchema,
  url: z.url(),
  public_url: z.url().nullable(),
});

export type NotionPage = z.infer<typeof pageSchema>;
