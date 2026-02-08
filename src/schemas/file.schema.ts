import { z } from 'zod';

/**
 * Notion file object schemas.
 *
 * Files can be Notion-hosted (uploaded through the UI), API-uploaded (via file upload API),
 * or externally hosted (with a URL). Used for page/block icons, covers, and file attachments.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/file-object
 */

/** Notion-hosted file. */
const notionFileSchema = z.object({
  type: z.literal('file'),
  file: z.object({
    url: z.url(),
    expiry_time: z.iso.datetime(),
  }),
});

/** API-uploaded file. */
const fileUploadSchema = z.object({
  type: z.literal('file_upload'),
  file_upload: z.object({
    id: z.uuid(),
  }),
});

/** Externally hosted file. */
const externalFileSchema = z.object({
  type: z.literal('external'),
  external: z.object({
    url: z.url(),
  }),
});

export const fileSchema = z.discriminatedUnion('type', [
  notionFileSchema,
  fileUploadSchema,
  externalFileSchema,
]);

export type NotionFile = z.infer<typeof fileSchema>;
export type NotionHostedFile = z.infer<typeof notionFileSchema>;
export type UploadedFile = z.infer<typeof fileUploadSchema>;
export type ExternalFile = z.infer<typeof externalFileSchema>;
