import { describe, expect, it } from 'vitest';
import { paginatedListSchema } from './pagination.schema';
import { parentSchema } from './parent.schema';

describe('paginatedListSchema', () => {
  it('should parse paginated list of pages', () => {
    const schema = paginatedListSchema(
      parentSchema, // Just using a simple schema for testing
    );

    const list = {
      object: 'list' as const,
      results: [
        {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ],
      next_cursor: 'cursor-123',
      has_more: true,
      type: 'page' as const,
    };

    const result = schema.safeParse(list);
    expect(result.success).toBe(true);
  });

  it('should parse empty paginated list', () => {
    const schema = paginatedListSchema(parentSchema);

    const list = {
      object: 'list' as const,
      results: [],
      next_cursor: null,
      has_more: false,
      type: 'block' as const,
    };

    const result = schema.safeParse(list);
    expect(result.success).toBe(true);
  });

  it('should parse a paginated list with request_status', () => {
    const schema = paginatedListSchema(parentSchema);

    const list = {
      object: 'list' as const,
      results: [],
      next_cursor: null,
      has_more: false,
      type: 'block' as const,
      request_status: {
        type: 'incomplete' as const,
        incomplete_reason: 'query_result_limit_reached' as const,
      },
    };

    const result = schema.safeParse(list);
    expect(result.success).toBe(true);
  });

  it('should parse a paginated list without request_status', () => {
    const schema = paginatedListSchema(parentSchema);

    const list = {
      object: 'list' as const,
      results: [],
      next_cursor: null,
      has_more: false,
      type: 'block' as const,
    };

    const result = schema.safeParse(list);
    expect(result.success).toBe(true);
    expect(result.data?.request_status).toBeUndefined();
  });
});
