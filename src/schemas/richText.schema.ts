import { z } from 'zod';
import { NOTION_COLORS } from './colors';
import { userSchema } from './user.schema';

/**
 * Notion rich text object schema.
 *
 * Rich text is used throughout the API for formatted text content. It supports
 * three types: text (with optional links), mentions (users, pages, dates, etc.),
 * and equations (LaTeX). All types support styling via annotations.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/rich-text
 */

/** Annotations for rich text. */
const annotationsSchema = z.object({
  bold: z.boolean(),
  italic: z.boolean(),
  strikethrough: z.boolean(),
  underline: z.boolean(),
  code: z.boolean(),
  color: z.enum(NOTION_COLORS),
});

/** Text content with optional link. */
const textContentSchema = z.object({
  content: z.string(),
  link: z.object({ url: z.url() }).nullable(),
});

/** Mention types. */
const databaseMentionSchema = z.object({
  type: z.literal('database'),
  database: z.object({
    id: z.uuid(),
  }),
});

const dateMentionSchema = z.object({
  type: z.literal('date'),
  date: z.object({
    start: z.string(),
    end: z.string().nullable(),
    time_zone: z.string().nullable().optional(),
  }),
});

const linkPreviewMentionSchema = z.object({
  type: z.literal('link_preview'),
  link_preview: z.object({
    url: z.url(),
  }),
});

const pageMentionSchema = z.object({
  type: z.literal('page'),
  page: z.object({
    id: z.uuid(),
  }),
});

const templateMentionDateSchema = z.object({
  type: z.literal('template_mention_date'),
  template_mention_date: z.enum(['today', 'now']),
});

const templateMentionUserSchema = z.object({
  type: z.literal('template_mention_user'),
  template_mention_user: z.literal('me'),
});

const templateMentionSchema = z.object({
  type: z.literal('template_mention'),
  template_mention: z.discriminatedUnion('type', [
    templateMentionDateSchema,
    templateMentionUserSchema,
  ]),
});

const userMentionSchema = z.object({
  type: z.literal('user'),
  user: userSchema,
});

const mentionSchema = z.discriminatedUnion('type', [
  databaseMentionSchema,
  dateMentionSchema,
  linkPreviewMentionSchema,
  pageMentionSchema,
  templateMentionSchema,
  userMentionSchema,
]);

/** Text rich text type. */
const textRichTextSchema = z.object({
  type: z.literal('text'),
  text: textContentSchema,
  annotations: annotationsSchema,
  plain_text: z.string(),
  href: z.url().nullable(),
});

/** Mention rich text type. */
const mentionRichTextSchema = z.object({
  type: z.literal('mention'),
  mention: mentionSchema,
  annotations: annotationsSchema,
  plain_text: z.string(),
  href: z.url().nullable(),
});

/** Equation rich text type. */
const equationRichTextSchema = z.object({
  type: z.literal('equation'),
  equation: z.object({
    expression: z.string(),
  }),
  annotations: annotationsSchema,
  plain_text: z.string(),
  href: z.url().nullable(),
});

export const richTextSchema = z.array(
  z.discriminatedUnion('type', [textRichTextSchema, mentionRichTextSchema, equationRichTextSchema]),
);

export type NotionRichText = z.infer<typeof richTextSchema>;
export type TextRichText = z.infer<typeof textRichTextSchema>;
export type MentionRichText = z.infer<typeof mentionRichTextSchema>;
export type EquationRichText = z.infer<typeof equationRichTextSchema>;
