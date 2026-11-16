import * as z from 'zod';
import { sessionErrorSchema, sessionSchema, sessionStatusSchema } from './session.schema';
import { sessionEventSchema } from './sessionEvent.schema';

/**
 * Session stream schemas.
 *
 * A streamed `sessions.stream()` request returns server-sent events. The `data` of each event is
 * an envelope. Its `type` names what arrived.
 *
 * Notion API reference:
 * https://developers.notion.com/guides/notion-agent-apis/upgrading-to-public-beta
 */

/**
 * @category Agents
 */
export const SESSION_STREAM_ENVELOPE_TYPES = [
  'session.snapshot',
  'event.provisional',
  'event.committed',
  'stream.timeout',
  'stream.end',
  'stream.error',
] as const;
/**
 * @category Agents
 */
export type SessionStreamEnvelopeType = (typeof SESSION_STREAM_ENVELOPE_TYPES)[number];

const knownEnvelopeSchema = z.discriminatedUnion('type', [
  /** The state of the session when the stream starts. */
  z.looseObject({ type: z.literal('session.snapshot'), session: sessionSchema }),
  /** A temporary event. A later envelope replaces it. Do not store it. */
  z.looseObject({ type: z.literal('event.provisional'), event: sessionEventSchema }),
  /** A durable event. Its `id` is a valid `continue_from` value. */
  z.looseObject({ type: z.literal('event.committed'), event: sessionEventSchema }),
  /** The stream ended early. The turn continues on the server. */
  z.looseObject({
    type: z.literal('stream.timeout'),
    session_id: z.string().trim(),
    message: z.string().trim().optional(),
  }),
  /** The turn is over. Only `requires_action` lets the session continue. */
  z.looseObject({
    type: z.literal('stream.end'),
    session_id: z.string().trim(),
    status: sessionStatusSchema,
  }),
  /** The turn failed. */
  z.looseObject({
    type: z.literal('stream.error'),
    session_id: z.string().trim().optional(),
    error: sessionErrorSchema,
  }),
]);

const KNOWN_ENVELOPE_TYPES: ReadonlySet<string> = new Set(SESSION_STREAM_ENVELOPE_TYPES);

/**
 * An envelope type that this SDK does not know yet. A known type never matches this schema.
 * The output sets `type` to `'unknown'` and keeps the original value in `unknown_type`.
 */
const unknownEnvelopeSchema = z
  .looseObject({
    type: z
      .string()
      .trim()
      .refine((type) => !KNOWN_ENVELOPE_TYPES.has(type), {
        error: 'Known stream envelope types must match their own schema',
      }),
  })
  .transform(({ type, ...rest }) => ({ ...rest, type: 'unknown' as const, unknown_type: type }));

/**
 * Session stream envelope. An envelope type that Notion adds later has `type: 'unknown'`, and
 * `unknown_type` holds the value from Notion.
 *
 * @category Agents
 */
export const sessionStreamEnvelopeSchema = z.union([knownEnvelopeSchema, unknownEnvelopeSchema]);
/**
 * @category Agents
 */
export type SessionStreamEnvelope = z.infer<typeof sessionStreamEnvelopeSchema>;
