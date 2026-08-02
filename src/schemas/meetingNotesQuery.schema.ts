import * as z from 'zod';
import { blockSchema } from './block.schema';
import { requestStatusSchema } from './pagination.schema';

/**
 * `POST /v1/blocks/meeting_notes/query` request/response schemas.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/query-meeting-notes
 */

export const MEETING_NOTES_QUERY_PROPERTIES = [
  'title',
  'attendees',
  'created_time',
  'created_by',
  'last_edited_time',
  'last_edited_by',
] as const;
export type MeetingNotesQueryProperty = (typeof MEETING_NOTES_QUERY_PROPERTIES)[number];

/**
 * Response shape is genuinely non-standard: no `object` field, no `next_cursor` at
 * all -- pagination is controlled purely by `limit` (max 50 per request, no cursor).
 */
export const meetingNotesQueryResponseSchema = z.object({
  results: z.array(blockSchema),
  has_more: z.boolean(),
  request_status: requestStatusSchema.optional(),
});
export type MeetingNotesQueryResponse = z.infer<typeof meetingNotesQueryResponseSchema>;
