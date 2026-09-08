import * as z from 'zod';

/**
 * Shared schema definitions used across multiple schema files.
 *
 * This file contains common schemas to avoid circular dependencies.
 */

/**
 * Notion date string schema. Accepts a date ("2023-02-23"), a UTC date-time
 * ("2023-02-23T00:00:00.000Z"), and a date-time with a UTC offset or no zone
 * ("2021-10-15T12:00:00.000-04:00", "2021-10-15T12:00:00.000").
 *
 * @category Shared Types
 */
export const notionDateStringSchema = z.union([
  z.iso.datetime({ offset: true, local: true }),
  z.iso.date(),
]);
