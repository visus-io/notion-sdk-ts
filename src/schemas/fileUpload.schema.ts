import * as z from 'zod';
import { notionDateStringSchema } from './shared.schema';

/**
 * Notion file upload object schema.
 *
 * File uploads represent files uploaded to Notion through the API. Each file upload has
 * a temporary upload URL. Each file upload has one of these states: pending, uploaded,
 * expired, or failed.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/file-upload-object
 *
 * @category File Uploads
 */

export const fileUploadSchema = z.object({
  object: z.literal('file_upload'),
  id: z.uuid(),
  created_time: notionDateStringSchema,
  expiry_time: notionDateStringSchema.nullable(),
  status: z.enum(['pending', 'uploaded', 'expired', 'failed']),
  filename: z.string().trim(),
  content_type: z.string().trim().nullable(),
  content_length: z.number().nullable(),
  upload_url: z.string().trim(),
  complete_url: z.string().trim(),
  file_import_result: z.string().trim(),
});

/**
 * @category File Uploads
 */
export type NotionFileUpload = z.infer<typeof fileUploadSchema>;
