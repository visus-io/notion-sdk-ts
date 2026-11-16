/**
 * Maximum sizes the Notion API allows in a request.
 *
 * @see https://developers.notion.com/reference/request-limits#size-limits
 *
 * @category Client & Core
 */
export const LIMITS = {
  /** Maximum characters in a single rich text `text.content` field. */
  RICH_TEXT_CONTENT: 2_000,

  /** Maximum characters in a rich text `text.link.url` field. */
  RICH_TEXT_LINK_URL: 2_000,

  /** Maximum characters in a rich text `equation.expression` field. */
  EQUATION_EXPRESSION: 1_000,

  /** Maximum elements in any block/rich-text array. */
  ARRAY_ELEMENTS: 100,

  /** Maximum characters in any URL property value. */
  URL: 2_000,

  /** Maximum characters in any email property value. */
  EMAIL: 200,

  /** Maximum characters in any phone number property value. */
  PHONE_NUMBER: 200,

  /** Maximum options in a multi-select property value. */
  MULTI_SELECT: 100,

  /** Maximum related pages in a relation property value. */
  RELATION: 100,

  /** Maximum users in a people property value. */
  PEOPLE: 100,

  /** Maximum file attachments on a comment. */
  COMMENT_ATTACHMENTS: 3,

  /** Maximum block elements in a single payload. */
  PAYLOAD_BLOCKS: 1_000,

  /** Maximum payload size in bytes. */
  PAYLOAD_SIZE_BYTES: 500 * 1_024,

  /** Maximum characters in an agent session `message`. */
  SESSION_MESSAGE: 10_000,

  /** Maximum characters in an agent session `prompt_context`. */
  SESSION_PROMPT_CONTEXT: 10_000,

  /** Maximum keys in an agent session `metadata` object. */
  SESSION_METADATA_KEYS: 20,

  /** Maximum characters in one agent session `metadata` value. */
  SESSION_METADATA_VALUE: 2_000,

  /** Maximum characters in the `query` text of an agent or session query. */
  AGENT_QUERY: 2_000,

  /** Maximum sort items in an agent, session, or session event query. */
  AGENT_SORTS: 2,

  /** Maximum size of an uploaded skill archive, in bytes (20 MiB). */
  SKILL_ARCHIVE_BYTES: 20 * 1_024 * 1_024,
} as const;

/**
 * Thrown when a value exceeds a Notion API size limit.
 *
 * The SDK throws this error before it sends the request. This gives you an
 * early, actionable message instead of a generic 400 response from the API.
 *
 * @category Errors
 */
export class NotionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotionValidationError';

    if ('captureStackTrace' in Error) {
      (
        Error as typeof Error & {
          captureStackTrace: (obj: object, fn: new (...args: unknown[]) => unknown) => void;
        }
      ).captureStackTrace(this, NotionValidationError);
    }
  }
}

// ---------------------------------------------------------------------------
// String length validators
// ---------------------------------------------------------------------------

/**
 * Assert that a string does not exceed `maxLength` characters.
 *
 * @throws {NotionValidationError}
 *
 * @category Client & Core
 */
export function validateStringLength(value: string, maxLength: number, label: string): void {
  if (value.length > maxLength) {
    throw new NotionValidationError(
      `${label} exceeds the ${maxLength}-character limit (got ${value.length})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Array length validators
// ---------------------------------------------------------------------------

/**
 * Assert that an array does not exceed `maxLength` elements.
 *
 * @throws {NotionValidationError}
 *
 * @category Client & Core
 */
export function validateArrayLength(array: unknown[], maxLength: number, label: string): void {
  if (array.length > maxLength) {
    throw new NotionValidationError(
      `${label} exceeds the ${maxLength}-element limit (got ${array.length})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Numeric range validators
// ---------------------------------------------------------------------------

/**
 * Assert that a number is within the inclusive range `[min, max]`.
 *
 * @throws {NotionValidationError}
 *
 * @category Client & Core
 */
export function validateNumberRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new NotionValidationError(`${label} must be between ${min} and ${max} (got ${value})`);
  }
}
