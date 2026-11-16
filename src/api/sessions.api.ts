import type { NotionClient } from '../client';
import { NotionAPIError, NotionNetworkError, NotionRequestTimeoutError } from '../errors';
import { Session } from '../models';
import { TRUSTED } from '../models/base.model';
import {
  type NotionSession,
  type PaginatedList,
  type SessionActionOption,
  type SessionEvent,
  sessionEventSchema,
  type SessionEventType,
  sessionSchema,
  type SessionStatus,
  type SessionStreamEnvelope,
  sessionStreamEnvelopeSchema,
} from '../schemas';
import {
  LIMITS,
  NotionValidationError,
  validateArrayLength,
  validateStringLength,
} from '../validation';
import { buildAgentQueryBody, validateNonEmptyArray } from './agentQuery';
import { sleep } from '../sleep';
import { BaseAPI, parsePaginatedResponse } from './base.api';

/**
 * A file attachment of a session message. Upload the file with `fileUploads` first.
 */
export interface SessionAttachment {
  type?: 'file_upload';
  file_upload: { id: string };
  name?: string;
}

/**
 * Options for sending a message. Send `agent_id` to start a new session, or `session_id` to
 * continue a session.
 */
export interface SendSessionMessageOptions {
  /** The message text (max 10,000 characters) */
  message: string;

  /** The Custom Agent UUID, or `notion_ai`. Required when you omit `session_id`. */
  agent_id?: string;

  /** The session to continue. Omit it to start a new session. */
  session_id?: string;

  /** File attachments (max 100) */
  attachments?: SessionAttachment[];

  /** String metadata for this turn (max 20 keys, max 2,000 characters per value) */
  metadata?: Record<string, string>;

  /** Extra context for the agent (max 10,000 characters) */
  prompt_context?: string;
}

/**
 * One answer to a required action.
 */
export interface SessionActionSubmission {
  action_id: string;
  option_id: SessionActionOption;
}

/**
 * Options for answering the required actions of a `requires_action` session.
 */
export interface SubmitSessionActionsOptions {
  /** The session that waits for the actions */
  session_id: string;

  /** The answers (1 to 100) */
  actions: SessionActionSubmission[];

  /** String metadata for this turn (max 20 keys, max 2,000 characters per value) */
  metadata?: Record<string, string>;
}

/**
 * Options for a streamed replay. The stream starts after the committed event `continue_from`.
 */
export interface ReplaySessionStreamOptions {
  session_id: string;

  /** The `id` of an `event.committed` event. Do not use a provisional event ID or a sequence. */
  continue_from: string;
}

/**
 * Options for `sessions.send()`.
 */
export type SendSessionOptions = SendSessionMessageOptions | SubmitSessionActionsOptions;

/**
 * Options for `sessions.stream()`.
 */
export type StreamSessionRequest = SendSessionOptions | ReplaySessionStreamOptions;

/**
 * Stream behavior for `sessions.stream()`.
 */
export interface SessionStreamOptions {
  /** Stop the stream */
  signal?: AbortSignal;

  /**
   * Reconnect after a `stream.timeout` envelope or a dropped connection (default: `true`).
   * The SDK resumes from the last `event.committed` event. It does not yield the timeout.
   */
  autoResume?: boolean;

  /**
   * The longest wait for data from the stream, in milliseconds (default: 300000, 5 minutes).
   * After this wait, the SDK treats the connection as dropped. Set `0` to wait with no limit.
   */
  idleTimeoutMs?: number;

  /**
   * Maximum reconnects in a row with no new `event.committed` event (default: 5). Each new
   * committed event resets the count.
   */
  maxResumes?: number;
}

/**
 * A timestamp condition of a session filter.
 */
export interface SessionTimestampCondition {
  before?: string;
  after?: string;
  on_or_before?: string;
  on_or_after?: string;
}

/**
 * One property condition of a session query filter.
 */
export type SessionPropertyFilter =
  | { property: 'id'; string: { equals: string } }
  | { property: 'agent_id'; string: { equals: string } }
  | { property: 'status'; status: { equals: SessionStatus } | { in: SessionStatus[] } }
  | { property: 'created_at' | 'updated_at'; timestamp: SessionTimestampCondition };

/**
 * Session query filter: one property condition, or an `and`/`or` compound (2 levels max).
 */
export type SessionFilter =
  SessionPropertyFilter | { and: SessionFilter[] } | { or: SessionFilter[] };

/**
 * Options for querying sessions.
 */
export interface QuerySessionsOptions {
  /** Case-insensitive text match on the session title (max 2000 characters) */
  query?: string;

  filter?: SessionFilter;

  /** 1 or 2 sort items. The default is `updated_at` descending. */
  sorts?: { property: 'created_at' | 'updated_at'; direction: 'ascending' | 'descending' }[];

  start_cursor?: string | null;

  /** Sessions per page (1 to 100) */
  page_size?: number;
}

/**
 * One property condition of a session event query filter.
 */
export type SessionEventPropertyFilter =
  | { property: 'id'; string: { equals: string } }
  | {
      property: 'type';
      event_type: { equals: SessionEventType } | { in: SessionEventType[] };
    }
  | {
      property: 'sequence';
      number: {
        greater_than?: number;
        greater_than_or_equal_to?: number;
        less_than?: number;
        less_than_or_equal_to?: number;
      };
    }
  | { property: 'created_at'; timestamp: SessionTimestampCondition & { equals?: string } };

/**
 * Session event query filter: one property condition, or an `and`/`or` compound.
 */
export type SessionEventFilter =
  SessionEventPropertyFilter | { and: SessionEventFilter[] } | { or: SessionEventFilter[] };

/**
 * Options for querying the events of a session.
 */
export interface QuerySessionEventsOptions {
  filter?: SessionEventFilter;

  /** 1 or 2 sort items. The default is `sequence` ascending. */
  sorts?: { property: 'sequence' | 'created_at'; direction: 'ascending' | 'descending' }[];

  start_cursor?: string | null;

  /** Events per page (1 to 100) */
  page_size?: number;
}

/**
 * Options for cancelling a session.
 */
export interface CancelSessionOptions {
  /**
   * The event of the turn to cancel. Omit it to cancel the current turn. Without it, the SDK
   * does not retry a `5xx` response, because a repeat can cancel a later turn.
   */
  event_id?: string;
}

/**
 * Options for polling a session.
 */
export interface PollSessionOptions {
  /** Maximum wait, in milliseconds (default: 300000 / 5 minutes) */
  timeoutMs?: number;

  /** Wait between two retrieves, in milliseconds (default: 1000, min: 250) */
  intervalMs?: number;
}

/**
 * @throws {NotionValidationError} If `value` is set and is not a finite number of 0 or more.
 */
function validateDuration(value: number | undefined, label: string): void {
  if (value !== undefined && !(Number.isFinite(value) && value >= 0)) {
    throw new NotionValidationError(`${label} must be a finite number of 0 or more`);
  }
}

/**
 * @throws {NotionValidationError} If `metadata` has too many keys or a value is too long.
 */
function validateMetadata(metadata: Record<string, string> | undefined): void {
  if (!metadata) {
    return;
  }

  const entries = Object.entries(metadata);
  if (entries.length > LIMITS.SESSION_METADATA_KEYS) {
    throw new NotionValidationError(
      `metadata exceeds the ${LIMITS.SESSION_METADATA_KEYS}-key limit (got ${entries.length})`,
    );
  }
  for (const [key, value] of entries) {
    validateStringLength(value, LIMITS.SESSION_METADATA_VALUE, `metadata.${key}`);
  }
}

/**
 * @throws {NotionValidationError} If the message options are not valid.
 */
function validateMessage(options: SendSessionMessageOptions): void {
  if (typeof options.message !== 'string') {
    throw new NotionValidationError('message must be a string');
  }
  validateStringLength(options.message, LIMITS.SESSION_MESSAGE, 'message');
  if (options.agent_id === undefined && options.session_id === undefined) {
    throw new NotionValidationError('Send agent_id to start a session, or session_id to continue');
  }
  if (options.attachments) {
    validateArrayLength(options.attachments, LIMITS.ARRAY_ELEMENTS, 'attachments');
  }
  if (options.prompt_context !== undefined) {
    validateStringLength(options.prompt_context, LIMITS.SESSION_PROMPT_CONTEXT, 'prompt_context');
  }
  validateMetadata(options.metadata);
}

/**
 * Validate the body of a `POST /v1/sessions` request. Only a stream accepts a replay body.
 *
 * @throws {NotionValidationError} If the body mixes modes or a value is not valid.
 */
function validateSessionRequest(options: StreamSessionRequest, allowReplay: boolean): void {
  const hasMessage = 'message' in options && options.message !== undefined;
  const hasActions = 'actions' in options && options.actions !== undefined;
  const hasReplay = 'continue_from' in options && options.continue_from !== undefined;

  if ([hasMessage, hasActions, hasReplay].filter(Boolean).length > 1) {
    throw new NotionValidationError('Send only one of message, actions, or continue_from');
  }

  if (hasReplay) {
    if (!allowReplay) {
      throw new NotionValidationError('continue_from is valid only with sessions.stream()');
    }
    if (!options.session_id) {
      throw new NotionValidationError('continue_from requires session_id');
    }
    return;
  }

  if (hasActions) {
    const submit = options;
    if (!submit.session_id) {
      throw new NotionValidationError('actions requires session_id');
    }
    validateNonEmptyArray(submit.actions, 'actions');
    validateMetadata(submit.metadata);
    return;
  }

  validateMessage(options as SendSessionMessageOptions);
}

/** The maximum number of `data` characters that a parse error shows. */
const MAX_SHOWN_DATA = 200;

/** The default longest wait for stream data, in milliseconds. */
const DEFAULT_STREAM_IDLE_TIMEOUT_MS = 300_000;

/** The maximum wait before a resume after a dropped connection, in milliseconds. */
const MAX_RESUME_DELAY_MS = 60_000;

/**
 * Parse the `data` of one server-sent event.
 *
 * @throws {NotionValidationError} If the data is not JSON.
 */
function parseEnvelope(data: string): SessionStreamEnvelope {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    const shown = data.length > MAX_SHOWN_DATA ? `${data.slice(0, MAX_SHOWN_DATA)}…` : data;
    throw new NotionValidationError(`Session stream sent data that is not JSON: ${shown}`);
  }
  return sessionStreamEnvelopeSchema.parse(json);
}

/** Return `true` for a replay body (`continue_from`), which is safe to send again. */
function isReplayBody(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { continue_from?: unknown }).continue_from !== undefined
  );
}

/** The state that a stream needs to resume. */
interface ResumeState {
  sessionId?: string;
  lastCommittedId?: string;
  /** Reconnects in a row with no new committed event */
  resumes: number;
  /** Dropped connections in a row with no new committed event */
  drops: number;
}

function trackEnvelope(state: ResumeState, envelope: SessionStreamEnvelope): void {
  switch (envelope.type) {
    case 'session.snapshot':
      state.sessionId = envelope.session.id;
      break;
    case 'event.committed':
      if (envelope.event.id !== state.lastCommittedId) {
        // The turn made progress. Count the reconnects again from zero.
        state.resumes = 0;
        state.drops = 0;
      }
      state.lastCommittedId = envelope.event.id;
      state.sessionId = envelope.event.session_id;
      break;
    case 'stream.timeout':
    case 'stream.end':
      state.sessionId = envelope.session_id;
      break;
    default:
      break;
  }
}

/** The way one connection of a stream ended. */
type ConnectionEnd =
  | { kind: 'done' }
  | { kind: 'timeout'; envelope: SessionStreamEnvelope }
  | { kind: 'dropped'; error: Error };

/**
 * Return `true` for an error after which the stream can resume from a committed event: a
 * network failure, a request timeout, or a retryable server error. A `429` is not resumable.
 * The client already applied its rate-limit policy (`retryOnRateLimit` and `maxRetries`).
 */
function isResumableError(error: unknown): error is Error {
  return (
    error instanceof NotionNetworkError ||
    error instanceof NotionRequestTimeoutError ||
    (error instanceof NotionAPIError && error.isRetryable() && !error.isRateLimited())
  );
}

/**
 * Return the wait before a resume after a dropped connection. Use exponential backoff, and wait
 * at least the `Retry-After` delay of an API error.
 */
function resumeDelayMs(drops: number, error: Error): number {
  const backoffMs = Math.min(Math.pow(2, drops) * 1_000, MAX_RESUME_DELAY_MS);
  const retryAfterMs = error instanceof NotionAPIError ? (error.retryAfterMs ?? 0) : 0;
  return Math.max(backoffMs, retryAfterMs);
}

/**
 * Sessions API client for chatting with agents.
 *
 * The agent works asynchronously. A new session starts as `queued`. Use {@link poll} or
 * {@link stream} to wait for the reply. Then read the `agent.message` events with
 * `sessions.events.query()`.
 *
 * @category Agents
 */
export class SessionsAPI extends BaseAPI<NotionSession, Session> {
  protected config = {
    schema: sessionSchema,
    ModelClass: Session,
    listType: 'session' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Session event operations.
   */
  readonly events = {
    /**
     * Query the event history of a session. The default order is `sequence` ascending.
     *
     * @param sessionId - The session ID
     * @param options - Filter, sorts, and pagination
     * @returns A paginated list of session events
     *
     * @see https://developers.notion.com/reference/notion-agent-apis/query-session-events
     */
    query: async (
      sessionId: string,
      options?: QuerySessionEventsOptions,
    ): Promise<PaginatedList<SessionEvent>> => {
      const response = await this.client.request<unknown>({
        method: 'POST',
        path: `/sessions/${sessionId}/events/query`,
        body: buildAgentQueryBody(options),
      });

      return parsePaginatedResponse(sessionEventSchema, response, 'session_event');
    },
  };

  /**
   * Send a message, or submit the answers to required actions.
   *
   * Send `agent_id` and `message` to start a session. Send `session_id` and `message` to
   * continue a session. Send `session_id` and `actions` to answer a `requires_action` session.
   *
   * @param options - The message or the actions
   * @returns The session wrapped in a Session model. A new session is `queued`.
   *
   * The SDK does not retry this call on a `5xx` response other than `529`. Such a response
   * does not mean that Notion rejected the message. Retrieve the session, or query its events,
   * before you send again. The SDK still retries a `429` and a `529`.
   *
   * @throws {NotionValidationError} If the options mix modes or a value exceeds a limit.
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/update-session
   */
  async send(options: SendSessionOptions): Promise<Session> {
    validateSessionRequest(options, false);

    // A 5xx does not mean that Notion rejected the turn. A retry can send the message twice.
    const response = await this.client.request<unknown>({
      method: 'POST',
      path: '/sessions',
      body: options,
      retryOnServerError: false,
    });

    return new Session(sessionSchema.parse(response), TRUSTED);
  }

  /**
   * Send a message, submit actions, or replay a turn, and stream the result as envelopes.
   *
   * The stream ends after a `stream.end` or `stream.error` envelope. A `stream.error` envelope
   * does not throw. Read `error.retryable` to decide what to do. With `autoResume` (the
   * default), the SDK reconnects after a `stream.timeout` envelope or a dropped connection. A
   * stream that ends with no `stream.end`, `stream.error`, or `stream.timeout` envelope counts
   * as a dropped connection. A network error, a request timeout, or a retryable `5xx` error
   * also counts as a dropped connection. A `429` error is thrown. The wait before a resume is
   * at least the `Retry-After` delay of the error.
   * It needs the ID of a committed event to resume. If it cannot resume, it yields the
   * `stream.timeout` envelope, or throws the error, and stops.
   * After a `stream.timeout` envelope, it reconnects at once. After a dropped connection, it
   * waits first: 1 second, then 2, 4, and so on, to a maximum of 60 seconds. A new committed
   * event resets this wait and the `maxResumes` count.
   *
   * Do not store `event.provisional` events. A later envelope replaces them.
   *
   * @param request - The message, the actions, or a replay from a committed event
   * @param options - A `signal` to stop the stream, and the resume behavior
   * @returns An async generator of stream envelopes
   *
   * @throws {NotionValidationError} If the request or `idleTimeoutMs` is not valid, or the
   * stream sends data that is not JSON.
   *
   * @see https://developers.notion.com/guides/notion-agent-apis/upgrading-to-public-beta
   */
  async *stream(
    request: StreamSessionRequest,
    options: SessionStreamOptions = {},
  ): AsyncGenerator<SessionStreamEnvelope> {
    validateSessionRequest(request, true);
    validateDuration(options.idleTimeoutMs, 'idleTimeoutMs');

    const autoResume = options.autoResume ?? true;
    const maxResumes = options.maxResumes ?? 5;
    const state: ResumeState = {
      sessionId: request.session_id,
      lastCommittedId: 'continue_from' in request ? request.continue_from : undefined,
      resumes: 0,
      drops: 0,
    };
    let body: unknown = request;

    for (;;) {
      const end: ConnectionEnd = yield* this.streamConnection(body, state, options);
      if (end.kind === 'done') {
        return;
      }

      const canResume =
        autoResume &&
        state.resumes < maxResumes &&
        state.sessionId !== undefined &&
        state.lastCommittedId !== undefined;

      if (!canResume) {
        if (end.kind === 'dropped') {
          throw end.error;
        }
        yield end.envelope;
        return;
      }

      state.resumes++;
      if (end.kind === 'dropped') {
        // Wait before the reconnect, so that a network outage does not use up every resume.
        await sleep(resumeDelayMs(state.drops, end.error), options.signal);
        state.drops++;
      }
      body = { session_id: state.sessionId, continue_from: state.lastCommittedId };
    }
  }

  /**
   * Yield the envelopes of one connection. Return how the connection ended.
   */
  private async *streamConnection(
    body: unknown,
    state: ResumeState,
    options: SessionStreamOptions,
  ): AsyncGenerator<SessionStreamEnvelope, ConnectionEnd> {
    try {
      for await (const frame of this.client.stream({
        idleTimeoutMs: options.idleTimeoutMs ?? DEFAULT_STREAM_IDLE_TIMEOUT_MS,
        method: 'POST',
        path: '/sessions',
        body,
        signal: options.signal,
        // Only a replay is safe to repeat. A message or an action can be sent twice.
        retryOnServerError: isReplayBody(body),
      })) {
        const envelope = parseEnvelope(frame.data);
        trackEnvelope(state, envelope);

        if (envelope.type === 'stream.timeout') {
          return { kind: 'timeout', envelope };
        }

        yield envelope;

        if (envelope.type === 'stream.end' || envelope.type === 'stream.error') {
          return { kind: 'done' };
        }
      }
    } catch (error) {
      // The SDK resumes only from a committed event, so a repeat of the turn cannot happen.
      if (isResumableError(error)) {
        return { kind: 'dropped', error };
      }
      throw error;
    }

    // The body ended without `stream.end`, `stream.error`, or `stream.timeout`. The turn can
    // still run, so treat this the same as a dropped connection.
    return {
      kind: 'dropped',
      error: new NotionNetworkError('The session stream ended before the turn ended'),
    };
  }

  /**
   * Retrieve a session.
   *
   * @param sessionId - The session ID
   * @returns The session wrapped in a Session model
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/retrieve-session
   */
  async retrieve(sessionId: string): Promise<Session> {
    return this.retrieveResource(`/sessions/${sessionId}`);
  }

  /**
   * Query the sessions that the token can read. A page can have no results while `has_more`
   * is `true`. Continue to the next page in that case.
   *
   * @param options - Text query, filter, sorts, and pagination
   * @returns A paginated list of sessions
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/query-sessions
   */
  async query(options?: QuerySessionsOptions): Promise<PaginatedList<Session>> {
    const response = await this.client.request<unknown>({
      method: 'POST',
      path: '/sessions/query',
      body: buildAgentQueryBody(options),
    });

    return this.parsePaginatedList(response);
  }

  /**
   * Cancel a turn of a session.
   *
   * Without `event_id`, Notion cancels the turn that runs when the request arrives. A `5xx`
   * response does not mean that the cancel failed, and a retry can cancel a later turn. So the
   * SDK does not retry a `5xx` response when `event_id` is not set. It still retries a `429`
   * and a `529`. Pass `event_id` to cancel one turn exactly.
   *
   * @param sessionId - The session ID
   * @param options - The event of the turn to cancel. Omit it to cancel the current turn.
   * @returns The session wrapped in a Session model
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/cancel-session
   */
  async cancel(sessionId: string, options?: CancelSessionOptions): Promise<Session> {
    const body: Record<string, unknown> = {};
    if (options?.event_id !== undefined) {
      body.event_id = options.event_id;
    }

    const response = await this.client.request<unknown>({
      method: 'POST',
      path: `/sessions/${sessionId}/cancel`,
      body,
      // Only a cancel of one turn is safe to repeat.
      retryOnServerError: options?.event_id !== undefined,
    });

    return new Session(sessionSchema.parse(response), TRUSTED);
  }

  /**
   * Retrieve a session until its status is not `queued` or `in_progress`.
   * The result can be `requires_action`. Check `session.requiresAction()`.
   *
   * @param sessionId - The session ID
   * @param options - Polling options
   * @returns The session wrapped in a Session model
   *
   * @throws {NotionRequestTimeoutError} If the session still runs after `timeoutMs`.
   * @throws {NotionValidationError} If `timeoutMs` or `intervalMs` is not a finite number of 0
   * or more.
   */
  async poll(sessionId: string, options?: PollSessionOptions): Promise<Session> {
    validateDuration(options?.timeoutMs, 'timeoutMs');
    validateDuration(options?.intervalMs, 'intervalMs');
    const deadline = Date.now() + (options?.timeoutMs ?? 300_000);
    const intervalMs = Math.max(options?.intervalMs ?? 1_000, 250);

    for (;;) {
      const session = await this.retrieve(sessionId);

      if (!session.isRunning()) {
        return session;
      }

      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        throw new NotionRequestTimeoutError(`Session ${sessionId} did not finish within timeout`);
      }

      // Cap the last sleep at the deadline. The next loop retrieves the session one more time,
      // so a turn that ends during the last sleep is not reported as a timeout.
      await sleep(Math.min(intervalMs, remainingMs));
    }
  }
}
