import { z } from 'zod';

/**
 * Notion user object schemas.
 *
 * Users can be people, bots, or partial user objects (just id and object type).
 * Used throughout the API for created_by and last_edited_by fields.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/user
 */

/** Bot owner information. */
const botOwnerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('workspace'),
    workspace: z.literal(true),
  }),
  z.object({
    type: z.literal('user'),
  }),
]);

/** Person user with email. */
const personUserSchema = z.object({
  object: z.literal('user'),
  id: z.uuid(),
  type: z.literal('person'),
  name: z.string().optional(),
  avatar_url: z.union([z.url(), z.null()]).optional(),
  person: z.object({
    email: z.string().email(),
  }),
});

/** Bot user with owner and workspace information. */
const botUserSchema = z.object({
  object: z.literal('user'),
  id: z.uuid(),
  type: z.literal('bot'),
  name: z.string().optional(),
  avatar_url: z.union([z.url(), z.null()]).optional(),
  bot: z.object({
    owner: botOwnerSchema,
    workspace_name: z.string().nullable().optional(),
    workspace_id: z.string().optional(),
    workspace_limits: z
      .object({
        max_file_upload_size_in_bytes: z.number().int(),
      })
      .optional(),
  }),
});

/** Partial user (only object and id, used in created_by/last_edited_by). */
const partialUserSchema = z.object({
  object: z.literal('user'),
  id: z.uuid(),
});

export const userSchema = z.union([personUserSchema, botUserSchema, partialUserSchema]);

export type NotionUser = z.infer<typeof userSchema>;
export type PersonUser = z.infer<typeof personUserSchema>;
export type BotUser = z.infer<typeof botUserSchema>;
export type PartialUser = z.infer<typeof partialUserSchema>;
