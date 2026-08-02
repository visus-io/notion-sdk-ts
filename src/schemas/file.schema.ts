import * as z from 'zod';
import { notionDateStringSchema } from './shared.schema';

/**
 * Notion file object schemas.
 *
 * Files can be Notion-hosted (uploaded through the UI), API-uploaded (via the file upload
 * API), or externally hosted (with a URL). This schema applies to page and block icons,
 * covers, and file attachments.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/file-object
 */

/** Notion-hosted file. */
const notionFileSchema = z.object({
  type: z.literal('file'),
  file: z.object({
    url: z.url(),
    expiry_time: notionDateStringSchema,
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

/**
 * @category File Uploads
 */
export const fileSchema = z.discriminatedUnion('type', [
  notionFileSchema,
  fileUploadSchema,
  externalFileSchema,
]);

/**
 * @category File Uploads
 */
export type NotionFile = z.infer<typeof fileSchema>;
/**
 * @category File Uploads
 */
export type NotionHostedFile = z.infer<typeof notionFileSchema>;
/**
 * @category File Uploads
 */
export type UploadedFile = z.infer<typeof fileUploadSchema>;
/**
 * @category File Uploads
 */
export type ExternalFile = z.infer<typeof externalFileSchema>;
