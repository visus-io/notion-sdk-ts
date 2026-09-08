import * as z from 'zod';

/**
 * Shared schema definitions used across multiple schema files.
 *
 * This file contains common schemas to avoid circular dependencies.
 */

/**
 * Notion date string schema.
 *
 * This schema validates ISO 8601 date strings from the Notion API.
 * It accepts three forms:
 *
 * - Date only: "2023-02-23".
 * - UTC date-time: "2023-02-23T00:00:00.000Z" (used for `created_time`,
 *   `last_edited_time`, and file `expiry_time`).
 * - Date-time with a UTC offset or with no zone: "2021-10-15T12:00:00.000-04:00"
 *   or "2021-10-15T12:00:00.000" (used for user-entered `date` property values
 *   and date mentions that carry a time).
 *
 * The Notion API docs describe date fields as "A date, with an optional time".
 *
 * @category Shared Types
 */
export const notionDateStringSchema = z.union([
  z.iso.datetime({ offset: true, local: true }),
  z.iso.date(),
]);
