import * as z from 'zod';
import { notionDateStringSchema } from './shared.schema';

/**
 * Async task object schema.
 *
 * Long-running operations (e.g. markdown writes with `allow_async: true`) return an
 * async task handle instead of completing synchronously. Poll `GET /v1/async_tasks/{id}`
 * until the task reaches a terminal status.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/retrieve-async-task
 */

export const ASYNC_TASK_STATUSES = [
  'queued',
  'running',
  'retrying',
  'succeeded',
  'failed',
] as const;
export type AsyncTaskStatus = (typeof ASYNC_TASK_STATUSES)[number];

const asyncTaskOperationSchema = z.object({
  surface: z.enum(['rest', 'mcp']),
  name: z.string().trim(),
});

// Loosely-typed error shape (status/code/message/object), matching NotionErrorResponse's
// fields; kept as z.string() for `code` rather than the closed NotionErrorCode union since
// async-task errors aren't guaranteed to be limited to that set.
const asyncTaskErrorSchema = z.object({
  object: z.literal('error'),
  status: z.number(),
  code: z.string().trim(),
  message: z.string().trim(),
});

export const asyncTaskSchema = z.object({
  object: z.literal('async_task'),
  id: z.uuid(),
  status: z.enum(ASYNC_TASK_STATUSES),
  status_url: z.url(),
  created_time: notionDateStringSchema,
  operation: asyncTaskOperationSchema,
  poll_after_seconds: z.number().optional(),
  // Present only when status === 'succeeded'. Shape is operation-dependent (e.g. a
  // PageMarkdown object for markdown writes), so it's kept as z.unknown() rather than
  // guessed/narrowed.
  result: z.unknown().optional(),
  // Present only when status === 'failed'.
  error: asyncTaskErrorSchema.optional(),
});
export type NotionAsyncTask = z.infer<typeof asyncTaskSchema>;
