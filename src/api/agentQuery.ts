import {
  LIMITS,
  NotionValidationError,
  validateNumberRange,
  validateStringLength,
} from '../validation';

/**
 * Shared body options of the agent, session, and session event query endpoints.
 */
export interface AgentQueryBodyOptions {
  query?: string;
  filter?: unknown;
  sorts?: unknown[];
  start_cursor?: string | null;
  page_size?: number;
}

/**
 * Validate the shared query options and build the request body. Omit each option that is
 * `undefined`. Omit a `null` cursor.
 *
 * @throws {NotionValidationError} If `query` is too long, `sorts` has 0 or more than 2 items,
 * or `page_size` is not an integer from 1 to 100.
 */
export function buildAgentQueryBody(
  options: AgentQueryBodyOptions | undefined,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (options?.query !== undefined) {
    validateStringLength(options.query, LIMITS.AGENT_QUERY, 'query');
    body.query = options.query;
  }

  if (options?.filter !== undefined) {
    body.filter = options.filter;
  }

  if (options?.sorts !== undefined) {
    validateSorts(options.sorts);
    body.sorts = options.sorts;
  }

  if (options?.start_cursor) {
    body.start_cursor = options.start_cursor;
  }

  if (options?.page_size !== undefined) {
    validatePageSize(options.page_size);
    body.page_size = options.page_size;
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined) {
      body[key] = value;
    }
  }

  return body;
}

/**
 * @throws {NotionValidationError} If `sorts` has 0 or more than 2 items.
 */
function validateSorts(sorts: unknown[]): void {
  if (sorts.length < 1 || sorts.length > LIMITS.AGENT_SORTS) {
    throw new NotionValidationError(
      `sorts must have 1 to ${LIMITS.AGENT_SORTS} items (got ${sorts.length})`,
    );
  }
}

/**
 * @throws {NotionValidationError} If `pageSize` is not an integer from 1 to 100.
 */
export function validatePageSize(pageSize: number): void {
  validateNumberRange(pageSize, 1, LIMITS.ARRAY_ELEMENTS, 'page_size');
  if (!Number.isInteger(pageSize)) {
    throw new NotionValidationError(`page_size must be an integer (got ${pageSize})`);
  }
}

/**
 * Assert that an array has from 1 to `LIMITS.ARRAY_ELEMENTS` items.
 *
 * @throws {NotionValidationError}
 */
export function validateNonEmptyArray(array: unknown[], label: string): void {
  if (array.length === 0) {
    throw new NotionValidationError(`${label} must have at least 1 item`);
  }
  if (array.length > LIMITS.ARRAY_ELEMENTS) {
    throw new NotionValidationError(
      `${label} exceeds the ${LIMITS.ARRAY_ELEMENTS}-element limit (got ${array.length})`,
    );
  }
}
