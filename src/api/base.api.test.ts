import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { parsePaginatedResponse } from './base.api';

describe('parsePaginatedResponse', () => {
  const itemSchema = z.object({ id: z.string().trim() });
  const response = {
    object: 'list',
    type: 'page',
    results: [{ id: 'a' }, { id: 'b' }],
    has_more: true,
    next_cursor: 'c2',
  };

  it('should return the parsed items when there is no mapper', () => {
    expect(parsePaginatedResponse(itemSchema, response, 'page')).toEqual({
      object: 'list',
      results: [{ id: 'a' }, { id: 'b' }],
      next_cursor: 'c2',
      has_more: true,
      type: 'page',
      request_status: undefined,
    });
  });

  it('should map each item and keep request_status', () => {
    const result = parsePaginatedResponse(
      itemSchema,
      {
        ...response,
        request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
      },
      'page',
      (item) => item.id.toUpperCase(),
    );

    expect(result.results).toEqual(['A', 'B']);
    expect(result.request_status).toEqual({
      type: 'incomplete',
      incomplete_reason: 'query_result_limit_reached',
    });
  });

  it('should parse with the same schema more than once', () => {
    expect(parsePaginatedResponse(itemSchema, response, 'page').results).toHaveLength(2);
    expect(parsePaginatedResponse(itemSchema, response, 'page').results).toHaveLength(2);
  });

  it('should reject an item that does not match the schema', () => {
    expect(() =>
      parsePaginatedResponse(itemSchema, { ...response, results: [{ id: 1 }] }, 'page'),
    ).toThrow();
  });
});
