import { describe, expect, it } from 'vitest';
import { viewDeleteResponseSchema, viewQueryResponseSchema, viewSchema } from './view.schema';

describe('viewSchema', () => {
  const baseUser = { object: 'user' as const, id: '323e4567-e89b-12d3-a456-426614174000' };

  const baseView = {
    object: 'view' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
    parent: {
      type: 'database_id' as const,
      database_id: '223e4567-e89b-12d3-a456-426614174000',
    },
    data_source_id: '323e4567-e89b-12d3-a456-426614174001',
    name: 'All items',
    created_time: '2026-01-01T00:00:00.000Z',
    last_edited_time: '2026-01-02T00:00:00.000Z',
    created_by: baseUser,
    last_edited_by: baseUser,
    url: 'https://notion.so/view-id',
  };

  it.each(['table', 'board', 'calendar'] as const)('should parse a %s view', (type) => {
    const result = viewSchema.safeParse({ ...baseView, type });
    expect(result.success).toBe(true);
  });

  it('should parse a view with a nullable data_source_id', () => {
    const result = viewSchema.safeParse({ ...baseView, type: 'table', data_source_id: null });
    expect(result.success).toBe(true);
  });

  it('should parse a view with filter/sorts/quick_filters/configuration', () => {
    const result = viewSchema.safeParse({
      ...baseView,
      type: 'table',
      filter: { property: 'Status' },
      sorts: [{ property: 'Name', direction: 'ascending' }],
      quick_filters: { some_filter: true },
      configuration: { type: 'table', some_field: 'value' },
    });
    expect(result.success).toBe(true);
  });

  it('should parse a widget view with dashboard_view_id', () => {
    const result = viewSchema.safeParse({
      ...baseView,
      type: 'chart',
      dashboard_view_id: '423e4567-e89b-12d3-a456-426614174002',
    });
    expect(result.success).toBe(true);
  });

  it('should reject an invalid view type', () => {
    const result = viewSchema.safeParse({ ...baseView, type: 'invalid_type' });
    expect(result.success).toBe(false);
  });
});

describe('viewDeleteResponseSchema', () => {
  it('should parse the partial delete response', () => {
    const result = viewDeleteResponseSchema.safeParse({
      object: 'view',
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'database_id',
        database_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      type: 'table',
    });
    expect(result.success).toBe(true);
  });
});

describe('viewQueryResponseSchema', () => {
  const baseQuery = {
    object: 'view_query' as const,
    id: '523e4567-e89b-12d3-a456-426614174003',
    view_id: '123e4567-e89b-12d3-a456-426614174000',
    expires_at: '2026-01-01T00:15:00.000Z',
    total_count: 0,
    results: [],
    next_cursor: null,
    has_more: false,
  };

  it('should parse a view query response without request_status', () => {
    const result = viewQueryResponseSchema.safeParse(baseQuery);
    expect(result.success).toBe(true);
    expect(result.data?.request_status).toBeUndefined();
  });

  it('should parse a view query response with request_status', () => {
    const result = viewQueryResponseSchema.safeParse({
      ...baseQuery,
      request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
    });
    expect(result.success).toBe(true);
  });
});
