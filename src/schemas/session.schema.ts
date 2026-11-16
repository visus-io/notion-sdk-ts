import * as z from 'zod';
import { notionDateStringSchema, type OpenEnum, openEnumSchema } from './shared.schema';

/**
 * Session schemas.
 *
 * A session is a chat with an agent. The agent works asynchronously, so a new session starts
 * as `queued`. Read the agent replies with the session events endpoint.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/notion-agent-apis/retrieve-session
 */

/**
 * @category Agents
 */
export const SESSION_STATUSES = [
  'queued',
  'in_progress',
  'requires_action',
  'completed',
  'failed',
  'canceled',
  'terminated',
] as const;
/**
 * @category Agents
 */
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/**
 * A session status in a response. It is one of {@link SESSION_STATUSES}, or a status that Notion
 * adds later.
 *
 * @category Agents
 */
export type ResponseSessionStatus = OpenEnum<SessionStatus>;

/**
 * Statuses that end the current turn without a pending action. You can send a new message to a
 * `completed` session.
 *
 * @category Agents
 */
export const TERMINAL_SESSION_STATUSES = [
  'completed',
  'failed',
  'canceled',
  'terminated',
] as const satisfies readonly SessionStatus[];

/**
 * Documented option IDs of a required action. Notion can add new IDs.
 *
 * @category Agents
 */
export const SESSION_ACTION_OPTIONS = ['approve', 'reject'] as const;
/**
 * @category Agents
 */
export type SessionActionOption = OpenEnum<(typeof SESSION_ACTION_OPTIONS)[number]>;

/**
 * Session statuses in responses. A status that Notion adds later is also valid.
 */
export const sessionStatusSchema = openEnumSchema(SESSION_STATUSES);

/**
 * An action that the agent waits for. Submit it with `sessions.send()`.
 *
 * @category Agents
 */
export const requiredActionSchema = z.looseObject({
  action_id: z.string().trim(),
  title: z.string().trim(),
  options: z.array(
    z.looseObject({
      /** Documented values: `approve`, `reject`. Notion can add new values. */
      id: openEnumSchema(SESSION_ACTION_OPTIONS),
      label: z.string().trim(),
    }),
  ),
});
/**
 * @category Agents
 */
export type RequiredAction = z.infer<typeof requiredActionSchema>;

/**
 * Session error.
 *
 * @category Agents
 */
export const sessionErrorSchema = z.looseObject({
  code: z.string().trim(),
  message: z.string().trim(),
  retryable: z.boolean(),
});
/**
 * @category Agents
 */
export type SessionError = z.infer<typeof sessionErrorSchema>;

const sessionCreatorSchema = z.looseObject({
  id: z.string().trim(),
  type: z.string().trim(),
});

const sessionAgentVersionSchema = z.looseObject({
  id: z.string().trim(),
  number: z.int(),
  published_at: z.string().trim().nullish(),
});

const KNOWN_MODEL_SELECTIONS: ReadonlySet<string> = new Set(['auto', 'pinned']);

/** A model selection that Notion adds later. A known value never matches this schema. */
const isNewModelSelection = (value: string): boolean => !KNOWN_MODEL_SELECTIONS.has(value);

const sessionModelsSchema = z.union([
  z.looseObject({ type: z.literal('auto') }),
  z.looseObject({ type: z.literal('pinned'), ids: z.array(z.string().trim().nullable()) }),
  z.looseObject({
    type: z.string().trim().refine(isNewModelSelection, {
      error: 'Known model selections must match their own schema',
    }),
  }),
]);

const nullableCountSchema = z.int().nonnegative().nullish();

/**
 * Session object.
 *
 * The send and cancel responses do not include `created_by`, `agent_version`, `models`, and the
 * usage fields. Retrieve the session to get them.
 *
 * @category Agents
 */
export const sessionSchema = z.looseObject({
  object: z.literal('session'),
  id: z.string().trim(),
  agent_id: z.string().trim(),
  title: z.string().trim(),
  /** Documented values: see {@link SESSION_STATUSES}. Notion can add new values. */
  status: sessionStatusSchema,
  created_at: notionDateStringSchema,
  updated_at: notionDateStringSchema,
  created_by: sessionCreatorSchema.optional(),
  agent_version: sessionAgentVersionSchema.nullish(),
  models: sessionModelsSchema.optional(),
  required_actions: z.array(requiredActionSchema).optional(),
  error: sessionErrorSchema.optional(),
  trigger_type: z.string().trim().optional(),
  type_labels: z.array(z.string().trim()).nullish(),
  chat_user_emails: z.array(z.string().trim()).nullish(),
  tool_types: z.array(z.string().trim()).nullish(),
  tool_call_count: nullableCountSchema,
  /** Premium AI credits used. Notion rounds the value down to two decimal places. */
  credits_used: z.number().nonnegative().nullish(),
  runs_completed: nullableCountSchema,
  message_count: nullableCountSchema,
});
/**
 * @category Agents
 */
export type NotionSession = z.infer<typeof sessionSchema>;
