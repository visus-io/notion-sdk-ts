import { z } from 'zod';

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
  created_time: z.iso.datetime(),
  expiry_time: z.iso.datetime().nullable(),
  status: z.enum(['pending', 'uploaded', 'expired', 'failed']),
  filename: z.string(),
  content_type: z.string().nullable(),
  content_length: z.number().nullable(),
  upload_url: z.string(),
  complete_url: z.string(),
  file_import_result: z.string(),
});

export type NotionFileUpload = z.infer<typeof fileUploadSchema>;
