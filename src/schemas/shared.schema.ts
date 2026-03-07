import * as z from 'zod';

/**
 * Shared schema definitions used across multiple schema files.
 *
 * This file contains common schemas to avoid circular dependencies.
 */

/**
 * Notion date string schema.
 *
 * Validates ISO 8601 date strings as returned by the Notion API.
 * Accepts both date-only format ("2023-02-23") and full datetime format ("2023-02-23T00:00:00.000Z").
 *
 * According to Notion API docs, date fields contain "A date, with an optional time".
 */
export const notionDateStringSchema = z.union([
  z.iso.datetime(), // Full ISO 8601 datetime: "2023-02-23T00:00:00.000Z"
  z.iso.date(), // Date only: "2023-02-23"
]);
