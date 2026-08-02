import * as z from 'zod';

/**
 * Custom emoji object schema.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/list-custom-emojis
 */

export const customEmojiSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
  url: z.url(),
});
export type NotionCustomEmoji = z.infer<typeof customEmojiSchema>;
