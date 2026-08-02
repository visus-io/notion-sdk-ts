import * as z from 'zod';
import { parentSchema } from './parent.schema';
import { richTextSchema } from './richText.schema';
import { notionDateStringSchema } from './shared.schema';
import { userSchema } from './user.schema';

/**
 * Notion comment object schema.
 *
 * Comments are discussions on pages and blocks. They can include rich text,
 * attachments, and custom display names.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/comment-object
 */

/** Comment attachment file schema. */
const commentAttachmentFileSchema = z.object({
  url: z.url(),
  expiry_time: notionDateStringSchema,
});

/** Comment attachment schema.
 *
 * @category Comments
 */
export const commentAttachmentSchema = z.object({
  category: z.enum(['image', 'video', 'file', 'audio', 'pdf']),
  file: commentAttachmentFileSchema,
});

/**
 * @category Comments
 */
export type CommentAttachment = z.infer<typeof commentAttachmentSchema>;

/** Comment display name schema (user or custom).
 *
 * @category Comments
 */
export const commentDisplayNameSchema = z.union([
  z.object({
    type: z.literal('user'),
    resolved_name: z.string().trim(),
  }),
  z.object({
    type: z.literal('custom'),
    resolved_name: z.string().trim(),
  }),
]);

/**
 * @category Comments
 */
export type CommentDisplayName = z.infer<typeof commentDisplayNameSchema>;

/**
 * @category Comments
 */
export const commentSchema = z.object({
  object: z.literal('comment'),
  id: z.uuid(),
  parent: parentSchema,
  discussion_id: z.uuid(),
  created_time: notionDateStringSchema,
  created_by: userSchema,
  last_edited_time: notionDateStringSchema,
  rich_text: richTextSchema,
  attachments: z.array(commentAttachmentSchema).optional(),
  display_name: commentDisplayNameSchema.optional(),
});

/**
 * @category Comments
 */
export type NotionComment = z.infer<typeof commentSchema>;
