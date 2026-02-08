import { z } from 'zod';
import { CODE_BLOCK_LANGUAGES } from './codeLanguages';
import { NOTION_COLORS } from './colors';
import { emojiSchema } from './emoji.schema';
import { fileSchema } from './file.schema';
import { parentSchema } from './parent.schema';
import { richTextSchema } from './richText.schema';
import { userSchema } from './user.schema';

/**
 * Notion block object schema.
 *
 * Blocks are the individual pieces of content that make up pages. Notion supports
 * 31 different block types including paragraphs, headings, lists, media, and more.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/block
 */

const headingsObject = z.object({
  rich_text: richTextSchema,
  color: z.enum(NOTION_COLORS),
  is_toggleable: z.boolean(),
  children: z.array(z.any()).optional(),
});

export const blockSchema = z.object({
  object: z.literal('block'),
  id: z.uuid(),
  parent: parentSchema,
  type: z.enum([
    'audio',
    'bookmark',
    'breadcrumb',
    'bulleted_list_item',
    'callout',
    'child_database',
    'child_page',
    'code',
    'column',
    'column_list',
    'divider',
    'embed',
    'equation',
    'file',
    'heading_1',
    'heading_2',
    'heading_3',
    'image',
    'link_preview',
    'numbered_list_item',
    'paragraph',
    'pdf',
    'quote',
    'synced_block',
    'table',
    'table_of_contents',
    'table_row',
    'template',
    'to_do',
    'toggle',
    'unsupported',
    'video',
  ]),
  created_time: z.iso.datetime(),
  created_by: userSchema,
  last_edited_time: z.iso.datetime(),
  last_edited_by: userSchema,
  archived: z.boolean(),
  in_trash: z.boolean(),
  has_children: z.boolean(),

  // Block-specific properties
  audio: fileSchema.optional(),
  bookmark: z
    .object({
      caption: richTextSchema,
      url: z.url(),
    })
    .optional(),
  breadcrumb: z.object({}).optional(),
  bulleted_list_item: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  callout: z
    .object({
      rich_text: richTextSchema,
      icon: z.union([emojiSchema, fileSchema]),
      color: z.enum(NOTION_COLORS),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  child_database: z
    .object({
      title: z.string(),
    })
    .optional(),
  child_page: z
    .object({
      title: z.string(),
    })
    .optional(),
  code: z
    .object({
      caption: richTextSchema,
      rich_text: richTextSchema,
      language: z.enum(CODE_BLOCK_LANGUAGES),
    })
    .optional(),
  column_list: z.object({}).optional(),
  column: z
    .object({
      width_ratio: z.number().min(0).max(1).optional(),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  divider: z.object({}).optional(),
  embed: z
    .object({
      url: z.url(),
    })
    .optional(),
  equation: z.object({ expression: z.string() }).optional(),
  file: z
    .object({
      caption: richTextSchema,
      type: z.enum(['file', 'file_upload', 'external']),
      file: fileSchema.optional(),
      external: fileSchema.optional(),
      file_upload: fileSchema.optional(),
      name: z.string().optional(),
    })
    .optional(),
  heading_1: headingsObject.optional(),
  heading_2: headingsObject.optional(),
  heading_3: headingsObject.optional(),
  image: fileSchema.optional(),
  link_preview: z.object({ url: z.url() }).optional(),
  numbered_list_item: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      list_start_index: z.number().int().optional(),
      list_format: z.enum(['numbers', 'letters', 'roman']).optional(),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  paragraph: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  pdf: z
    .object({
      caption: richTextSchema,
      type: z.enum(['file', 'file_upload', 'external']),
      file: fileSchema.optional(),
      external: fileSchema.optional(),
      file_upload: fileSchema.optional(),
      name: z.string().optional(),
    })
    .optional(),
  quote: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  synced_block: z
    .object({
      synced_from: z
        .object({
          type: z.literal('block_id'),
          block_id: z.uuid(),
        })
        .nullable(),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  table: z
    .object({
      table_width: z.number().int(),
      has_column_header: z.boolean(),
      has_row_header: z.boolean(),
    })
    .optional(),
  table_of_contents: z
    .object({
      color: z.enum(NOTION_COLORS),
    })
    .optional(),
  table_row: z
    .object({
      cells: z.array(richTextSchema),
    })
    .optional(),
  template: z
    .object({
      rich_text: richTextSchema,
      children: z.array(z.any()).optional(),
    })
    .optional(),
  to_do: z
    .object({
      rich_text: richTextSchema,
      checked: z.boolean().optional(),
      color: z.enum(NOTION_COLORS),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  toggle: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      children: z.array(z.any()).optional(),
    })
    .optional(),
  video: fileSchema.optional(),
});

export type NotionBlock = z.infer<typeof blockSchema>;
