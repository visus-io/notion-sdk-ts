import * as z from 'zod';

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
 * As of API version 2025-09-03, 'data_source' and 'page_or_data_source' are used
 * instead of 'database' and 'page_or_database' in search results.
 */
export type PaginatedListType =
  | 'block'
  | 'comment'
  | 'custom_emoji'
  | 'database'
  | 'data_source'
  | 'page'
  | 'page_or_database'
  | 'page_or_data_source'
  | 'property_item'
  | 'user'
  | 'view';

/**
 * Reasons a query can be reported as incomplete despite `has_more` being `false`.
 * Currently only emitted when a query hits the 10,000-result pagination depth cap.
 */
export const REQUEST_STATUS_INCOMPLETE_REASONS = ['query_result_limit_reached'] as const;
export type RequestStatusIncompleteReason = (typeof REQUEST_STATUS_INCOMPLETE_REASONS)[number];

/**
 * Signals that a query was truncated even though `has_more` is `false` -- e.g. data source,
 * view, and meeting-notes queries cap at 10,000 results. Callers that need every row must
 * detect this and re-query with a narrower filter (see the pagination helpers).
 */
export const requestStatusSchema = z.object({
  type: z.literal('incomplete'),
  incomplete_reason: z.enum(REQUEST_STATUS_INCOMPLETE_REASONS),
});
export type RequestStatus = z.infer<typeof requestStatusSchema>;

/**
 * Base paginated list response schema.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const paginatedListSchema = <T extends z.ZodTypeAny>(resultSchema: T) => {
  return z.object({
    object: z.literal('list'),
    results: z.array(resultSchema),
    next_cursor: z.string().trim().nullable(),
    has_more: z.boolean(),
    type: z.enum([
      'block',
      'comment',
      'custom_emoji',
      'database',
      'data_source',
      'page',
      'page_or_database',
      'page_or_data_source',
      'property_item',
      'user',
      'view',
    ]),
    request_status: requestStatusSchema.optional(),
  });
};

/**
 * Pagination parameters for requests.
 */
export interface PaginationParameters {
  /** The number of items to return (default: 100, max: 100) */
  page_size?: number;

  /** The cursor value from a previous response to continue pagination (`null` is treated the same as omitted) */
  start_cursor?: string | null;
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
  request_status?: RequestStatus;
};
