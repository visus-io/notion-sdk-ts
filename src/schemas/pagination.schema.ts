import { z } from 'zod';

/**
 * Pagination schemas and utilities.
 *
 * The Notion API uses cursor-based pagination for list endpoints. Responses include
 * results, a next_cursor, and has_more flag. This file provides reusable schemas
 * and types for working with paginated responses.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/intro#pagination
 */

/**
 * Paginated list response type.
 */
export type PaginatedListType =
  | 'block'
  | 'comment'
  | 'database'
  | 'page'
  | 'page_or_database'
  | 'property_item'
  | 'user';

/**
 * Base paginated list response schema.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const paginatedListSchema = <T extends z.ZodTypeAny>(resultSchema: T) => {
  return z.object({
    object: z.literal('list'),
    results: z.array(resultSchema),
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
    type: z.enum([
      'block',
      'comment',
      'database',
      'page',
      'page_or_database',
      'property_item',
      'user',
    ]),
  });
};

/**
 * Pagination parameters for requests.
 */
export interface PaginationParameters {
  /** The number of items to return (default: 100, max: 100) */
  page_size?: number;

  /** The cursor value from a previous response to continue pagination */
  start_cursor?: string;
}

/**
 * Helper to create paginated response type.
 */
export type PaginatedList<T> = {
  object: 'list';
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
  type: PaginatedListType;
};
