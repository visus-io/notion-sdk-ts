import { describe, expect, it } from 'vitest';
import { meetingNotesQueryResponseSchema } from './meetingNotesQuery.schema';

describe('meetingNotesQueryResponseSchema', () => {
  it('should parse an empty result set', () => {
    const response = {
      results: [],
      has_more: false,
    };

    const result = meetingNotesQueryResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should parse results with meeting_notes blocks', () => {
    const response = {
      results: [
        {
          object: 'block',
          id: '123e4567-e89b-12d3-a456-426614174000',
          parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
          type: 'meeting_notes',
          created_time: '2026-01-01T00:00:00.000Z',
          created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
          last_edited_time: '2026-01-02T00:00:00.000Z',
          last_edited_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
          in_trash: false,
          has_children: false,
          meeting_notes: {
            title: [],
            status: 'in_progress',
            children: {},
          },
        },
      ],
      has_more: false,
    };

    const result = meetingNotesQueryResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should parse with request_status', () => {
    const response = {
      results: [],
      has_more: false,
      request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
    };

    const result = meetingNotesQueryResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});
