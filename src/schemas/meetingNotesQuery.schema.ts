import * as z from 'zod';
import { blockSchema } from './block.schema';
import { requestStatusSchema } from './pagination.schema';

/**
 * `POST /v1/blocks/meeting_notes/query` request/response schemas.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/query-meeting-notes
 *
 * @category Pages
 */

export const MEETING_NOTES_QUERY_PROPERTIES = [
  'title',
  'attendees',
  'created_time',
  'created_by',
  'last_edited_time',
  'last_edited_by',
] as const;
/**
 * @category Pages
 */
export type MeetingNotesQueryProperty = (typeof MEETING_NOTES_QUERY_PROPERTIES)[number];

/**
 * This response shape is non-standard. It has no `object` field and no `next_cursor`
 * field. The `limit` parameter alone controls pagination, up to 50 results per request,
 * with no cursor.
 *
 * @category Pages
 */
export const meetingNotesQueryResponseSchema = z.object({
  results: z.array(blockSchema),
  has_more: z.boolean(),
  request_status: requestStatusSchema.optional(),
});
/**
 * @category Pages
 */
export type MeetingNotesQueryResponse = z.infer<typeof meetingNotesQueryResponseSchema>;
