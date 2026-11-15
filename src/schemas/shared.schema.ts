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

/**
 * Notification modes for a write request.
 *
 * - `default`: Notion sends the usual notifications.
 * - `silent`: Notion does not send page update, @mention, or Person property notifications.
 *   Automations, reminders, and webhooks still run.
 *
 * @category Shared Types
 */
/**
 * A string value with documented members. Notion can add new members, so any other string is
 * also valid. Compare against the documented members to narrow the value.
 *
 * @category Shared Types
 */
export type OpenEnum<T extends string> = T | (string & Record<never, never>);

/**
 * Build a schema that accepts the documented `values` and any other string. The output type
 * keeps the documented values for autocomplete. A new value from Notion does not fail the parse.
 *
 * @param _values - The documented values. Only the type uses them.
 *
 * @category Shared Types
 */
export function openEnumSchema<const T extends readonly [string, ...string[]]>(
  _values: T,
): z.ZodType<OpenEnum<T[number]>> {
  return z.string().trim();
}

export const NOTIFICATION_MODES = ['default', 'silent'] as const;

/**
 * @category Shared Types
 */
export type NotificationMode = (typeof NOTIFICATION_MODES)[number];

/**
 * Notification settings for a write request.
 *
 * @category Shared Types
 */
export interface NotificationOptions {
  mode: NotificationMode;
}
