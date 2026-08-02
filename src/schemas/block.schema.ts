import * as z from 'zod';
import { CODE_BLOCK_LANGUAGES } from './codeLanguages';
import { NOTION_COLORS } from './colors';
import { fileSchema } from './file.schema';
import { iconSchema } from './icon.schema';
import { parentSchema } from './parent.schema';
import { richTextSchema } from './richText.schema';
import { notionDateStringSchema } from './shared.schema';
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

let childrenSchema: z.ZodOptional<z.ZodArray<z.ZodTypeAny>> | undefined;

const getChildrenSchema = (): z.ZodOptional<z.ZodArray<z.ZodTypeAny>> => {
  childrenSchema ??= z.array(blockSchema).optional();
  return childrenSchema;
};

/**
 * Position for inserting block children in the Append Block Children endpoint.
 */
export const blockPositionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('after_block'), after_block: z.object({ id: z.uuid() }) }),
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('end') }),
]);

export type BlockPosition = z.infer<typeof blockPositionSchema>;

const headingsObjectSchema = z.object({
  rich_text: richTextSchema,
  color: z.enum(NOTION_COLORS),
  is_toggleable: z.boolean(),
  get children() {
    return getChildrenSchema();
  },
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
    'heading_4',
    'image',
    'link_preview',
    'numbered_list_item',
    'paragraph',
    'pdf',
    'quote',
    'synced_block',
    'tab',
    'table',
    'table_of_contents',
    'table_row',
    'template',
    'to_do',
    'toggle',
    'meeting_notes',
    'unsupported',
    'video',
  ]),
  created_time: notionDateStringSchema,
  created_by: userSchema,
  last_edited_time: notionDateStringSchema,
  last_edited_by: userSchema,
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
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  callout: z
    .object({
      rich_text: richTextSchema,
      icon: iconSchema,
      color: z.enum(NOTION_COLORS),
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  child_database: z
    .object({
      title: z.string().trim(),
    })
    .optional(),
  child_page: z
    .object({
      title: z.string().trim(),
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
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  divider: z.object({}).optional(),
  embed: z
    .object({
      url: z.url(),
    })
    .optional(),
  equation: z
    .object({
      // eslint-disable-next-line zod/prefer-string-schema-with-trim -- LaTeX expression must preserve whitespace from Notion API
      expression: z.string(),
    })
    .optional(),
  file: z
    .object({
      caption: richTextSchema,
      type: z.enum(['file', 'file_upload', 'external']),
      file: fileSchema.optional(),
      external: fileSchema.optional(),
      file_upload: fileSchema.optional(),
      name: z.string().trim().optional(),
    })
    .optional(),
  heading_1: headingsObjectSchema.optional(),
  heading_2: headingsObjectSchema.optional(),
  heading_3: headingsObjectSchema.optional(),
  heading_4: headingsObjectSchema.optional(),
  image: fileSchema.optional(),
  link_preview: z.object({ url: z.url() }).optional(),
  numbered_list_item: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      list_start_index: z.int().optional(),
      list_format: z.enum(['numbers', 'letters', 'roman']).optional(),
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  paragraph: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      icon: iconSchema.optional(),
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  pdf: z
    .object({
      caption: richTextSchema,
      type: z.enum(['file', 'file_upload', 'external']),
      file: fileSchema.optional(),
      external: fileSchema.optional(),
      file_upload: fileSchema.optional(),
      name: z.string().trim().optional(),
    })
    .optional(),
  quote: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      get children() {
        return getChildrenSchema();
      },
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
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  tab: z.object({}).optional(),
  table: z
    .object({
      table_width: z.int(),
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
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  to_do: z
    .object({
      rich_text: richTextSchema,
      checked: z.boolean().optional(),
      color: z.enum(NOTION_COLORS),
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  toggle: z
    .object({
      rich_text: richTextSchema,
      color: z.enum(NOTION_COLORS),
      get children() {
        return getChildrenSchema();
      },
    })
    .optional(),
  // Meeting-notes blocks are server-managed: title/status/child-block-ids are populated
  // by Notion, not hand-constructed by clients. Exact `status` enum values weren't
  // confirmed against a live response, so it's kept permissive (a trimmed string)
  // rather than a guessed closed enum, to avoid rejecting valid live responses.
  meeting_notes: z
    .object({
      title: richTextSchema,
      status: z.string().trim(),
      children: z.object({
        summary_block_id: z.uuid().nullish(),
        notes_block_id: z.uuid().nullish(),
        transcript_block_id: z.uuid().nullish(),
      }),
      calendar_event: z.unknown().nullish(),
      recording: z.unknown().nullish(),
    })
    .optional(),
  unsupported: z.object({}).optional(),
  video: fileSchema.optional(),
});

export type NotionBlock = z.infer<typeof blockSchema>;
