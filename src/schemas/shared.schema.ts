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
 * It accepts a date-only format ("2023-02-23") and a full date-time format
 * ("2023-02-23T00:00:00.000Z").
 *
 * The Notion API docs describe date fields as "A date, with an optional time".
 *
 * @category Shared Types
 */
export const notionDateStringSchema = z.union([
  z.iso.datetime(), // Full ISO 8601 datetime: "2023-02-23T00:00:00.000Z"
  z.iso.date(), // Date only: "2023-02-23"
]);
