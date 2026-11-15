import * as z from 'zod';
import { requiredActionSchema, sessionErrorSchema, sessionStatusSchema } from './session.schema';

/**
 * Session event schemas.
 *
 * A session event is one durable record in the history of a session: a user message, an agent
 * message, agent thinking, a tool call, a tool result, or a status change. Query them with
 * `sessions.events.query()`. A streamed `event.committed` envelope has the same shape.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/notion-agent-apis/query-session-events
 */

/**
 * @category Agents
 */
export const SESSION_EVENT_TYPES = [
  'user.message',
  'agent.message',
  'agent.thinking',
  'agent.tool_use',
  'agent.tool_result',
  'session.status',
] as const;
/**
 * @category Agents
 */
export type SessionEventType = (typeof SESSION_EVENT_TYPES)[number];

const baseEventShape = {
  object: z.literal('session_event'),
  id: z.string().trim(),
  session_id: z.string().trim(),
  sequence: z.int(),
  created_at: z.string().trim(),
};

const textContentSchema = z.looseObject({
  type: z.literal('text'),
  // eslint-disable-next-line zod/prefer-string-schema-with-trim -- message text must preserve whitespace from Notion API
  text: z.string(),
});

const fileContentSchema = z.looseObject({
  type: z.literal('file'),
  name: z.string().trim(),
  content_type: z.string().trim(),
  url: z.string().trim(),
  expiry_time: z.string().trim().optional(),
});

/**
 * One content item of a message event. A content type that Notion adds later has
 * `type: 'unknown'`, and `unknown_type` holds the value from Notion.
 *
 * @category Agents
 */
const KNOWN_CONTENT_TYPES: readonly string[] = ['text', 'file'];

/**
 * A content type that this SDK does not know yet. A known type never matches this schema.
 * The output sets `type` to `'unknown'` and keeps the original value in `unknown_type`.
 */
const unknownContentSchema = z
  .looseObject({
    type: z
      .string()
      .trim()
      .refine((type) => !KNOWN_CONTENT_TYPES.includes(type), {
        error: 'Known content types must match their own schema',
      }),
  })
  .transform(({ type, ...rest }) => ({ ...rest, type: 'unknown' as const, unknown_type: type }));

export const sessionEventContentSchema = z.union([
  z.discriminatedUnion('type', [textContentSchema, fileContentSchema]),
  unknownContentSchema,
]);
/**
 * @category Agents
 */
export type SessionEventContent = z.infer<typeof sessionEventContentSchema>;

const eventCreatorSchema = z.looseObject({
  id: z.string().trim(),
  type: z.string().trim(),
});

const userMessageEventSchema = z.looseObject({
  ...baseEventShape,
  type: z.literal('user.message'),
  content: z.array(sessionEventContentSchema),
  created_by: eventCreatorSchema.nullish(),
  metadata: z.record(z.string(), z.string().trim()).nullish(),
});

const agentMessageEventSchema = z.looseObject({
  ...baseEventShape,
  type: z.literal('agent.message'),
  content: z.array(sessionEventContentSchema),
  created_by: eventCreatorSchema.nullish(),
  metadata: z.looseObject({ model: z.string().trim() }).nullish(),
});

const agentThinkingEventSchema = z.looseObject({
  ...baseEventShape,
  type: z.literal('agent.thinking'),
  content: z.array(textContentSchema),
});

const agentToolUseEventSchema = z.looseObject({
  ...baseEventShape,
  type: z.literal('agent.tool_use'),
  tool_name: z.string().trim(),
});

const agentToolResultEventSchema = z.looseObject({
  ...baseEventShape,
  type: z.literal('agent.tool_result'),
  tool_use_id: z.string().trim(),
  tool_name: z.string().trim(),
  is_error: z.boolean(),
});

const sessionStatusEventSchema = z.looseObject({
  ...baseEventShape,
  type: z.literal('session.status'),
  /** Any session status. Notion can add new values. */
  status: sessionStatusSchema,
  required_actions: z.array(requiredActionSchema).optional(),
  error: sessionErrorSchema.optional(),
});

const knownSessionEventSchema = z.discriminatedUnion('type', [
  userMessageEventSchema,
  agentMessageEventSchema,
  agentThinkingEventSchema,
  agentToolUseEventSchema,
  agentToolResultEventSchema,
  sessionStatusEventSchema,
]);

const KNOWN_EVENT_TYPES: readonly string[] = SESSION_EVENT_TYPES;

/**
 * An event type that this SDK does not know yet. A known type never matches this schema.
 * The output sets `type` to `'unknown'` and keeps the original value in `unknown_type`, so a
 * check such as `event.type === 'agent.message'` narrows the union.
 */
const unknownSessionEventSchema = z
  .looseObject({
    ...baseEventShape,
    type: z
      .string()
      .trim()
      .refine((type) => !KNOWN_EVENT_TYPES.includes(type), {
        error: 'Known session event types must match their own schema',
      }),
  })
  .transform(({ type, ...rest }) => ({ ...rest, type: 'unknown' as const, unknown_type: type }));

/**
 * Session event. An event type that Notion adds later parses with the base fields only. Its
 * `type` is `'unknown'` and `unknown_type` holds the value from Notion.
 *
 * @category Agents
 */
export const sessionEventSchema = z.union([knownSessionEventSchema, unknownSessionEventSchema]);
/**
 * @category Agents
 */
export type SessionEvent = z.infer<typeof sessionEventSchema>;
