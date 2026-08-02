import * as z from 'zod';
import { emojiSchema } from './emoji.schema';
import { fileSchema } from './file.schema';

/**
 * Notion native icon and custom emoji icon object schemas.
 *
 * Native icons reference one of Notion's built-in icon-picker icons by name.
 * Custom emoji icons reference a workspace-managed custom emoji by id.
 * Combined with `emojiSchema` and `fileSchema`, these make up the full set
 * of icon object variants usable on pages, databases, data sources, and
 * callout blocks.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/emoji-object
 */

/** Colors available for native (icon-picker) icons. */
export const NATIVE_ICON_COLORS = [
  'gray',
  'lightgray',
  'brown',
  'yellow',
  'orange',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
] as const;

export type NativeIconColor = (typeof NATIVE_ICON_COLORS)[number];

/** Native (icon-picker) icon. */
export const nativeIconSchema = z.object({
  type: z.literal('icon'),
  icon: z.object({
    name: z.string().trim(),
    color: z.enum(NATIVE_ICON_COLORS).optional(),
  }),
});

export type NativeIcon = z.infer<typeof nativeIconSchema>;

/** Custom emoji icon. */
export const customEmojiIconSchema = z.object({
  type: z.literal('custom_emoji'),
  custom_emoji: z.object({
    id: z.uuid(),
    name: z.string().trim().optional(),
    url: z.url().optional(),
  }),
});

export type CustomEmojiIcon = z.infer<typeof customEmojiIconSchema>;

/** Shared icon schema covering all icon object variants. */
export const iconSchema = z.union([
  fileSchema,
  emojiSchema,
  nativeIconSchema,
  customEmojiIconSchema,
]);

export type NotionIcon = z.infer<typeof iconSchema>;
