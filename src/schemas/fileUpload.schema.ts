import * as z from 'zod';
import { notionDateStringSchema } from './shared.schema';

/**
 * Notion file upload object schema.
 *
 * File uploads represent files uploaded to Notion via the API. They have a temporary
 * upload URL and can be in various states (pending, uploaded, expired, failed).
 *
 * Notion API reference:
 * https://developers.notion.com/reference/file-upload-object
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

export type NotionFileUpload = z.infer<typeof fileUploadSchema>;
