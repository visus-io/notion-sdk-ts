import * as z from 'zod';

/**
 * Notion emoji object schema.
 *
 * You can use emojis as icons for pages, databases, and other objects.
 * This schema stores the emoji character as a string.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/emoji-object
 *
 * @category Custom Emoji & Icons
 */

export const emojiSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string().trim(),
});

/**
 * @category Custom Emoji & Icons
 */
export type NotionEmoji = z.infer<typeof emojiSchema>;
