import { z } from 'zod';
import { parentSchema } from './parent.schema';
import { richTextSchema } from './richText.schema';
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
  expiry_time: z.iso.datetime(),
});

/** Comment attachment schema. */
export const commentAttachmentSchema = z.object({
  category: z.enum(['image', 'video', 'file', 'audio', 'pdf']),
  file: commentAttachmentFileSchema,
});

export type CommentAttachment = z.infer<typeof commentAttachmentSchema>;

/** Comment display name schema (user or custom). */
export const commentDisplayNameSchema = z.union([
  z.object({
    type: z.literal('user'),
    resolved_name: z.string(),
  }),
  z.object({
    type: z.literal('custom'),
    resolved_name: z.string(),
  }),
]);

export type CommentDisplayName = z.infer<typeof commentDisplayNameSchema>;

export const commentSchema = z.object({
  object: z.literal('comment'),
  id: z.uuid(),
  parent: parentSchema,
  discussion_id: z.uuid(),
  created_time: z.iso.datetime(),
  created_by: userSchema,
  last_edited_time: z.iso.datetime(),
  rich_text: richTextSchema,
  attachments: z.array(commentAttachmentSchema).optional(),
  display_name: commentDisplayNameSchema.optional(),
});

export type NotionComment = z.infer<typeof commentSchema>;
