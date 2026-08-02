import * as z from 'zod';
import { fileSchema } from './file.schema';
import { iconSchema } from './icon.schema';
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
 *
 * @category Pages
 */

export const pageSchema = z.object({
  object: z.literal('page'),
  id: z.uuid(),
  created_time: notionDateStringSchema,
  created_by: userSchema,
  last_edited_time: notionDateStringSchema,
  last_edited_by: userSchema,
  in_trash: z.boolean(),
  is_archived: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  icon: z.nullable(iconSchema),
  cover: z.nullable(fileSchema),
  properties: z.record(z.string().trim(), pagePropertiesSchema),
  parent: parentSchema,
  url: z.url(),
  public_url: z.url().nullable(),
});

/**
 * @category Pages
 */
export type NotionPage = z.infer<typeof pageSchema>;
