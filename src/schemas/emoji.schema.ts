import { z } from 'zod';

/**
 * Notion emoji object schema.
 *
 * Emojis can be used as icons for pages, databases, and other objects.
 * Contains the emoji character as a string.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/emoji-object
 */

export const emojiSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string(),
});

export type NotionEmoji = z.infer<typeof emojiSchema>;
