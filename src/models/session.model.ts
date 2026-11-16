import { BaseModel, type TRUSTED } from './base.model';
import {
  type NotionSession,
  type RequiredAction,
  type ResponseSessionStatus,
  type SessionError,
  sessionSchema,
  TURN_END_SESSION_STATUSES,
} from '../schemas';

const TURN_END_STATUSES: readonly string[] = TURN_END_SESSION_STATUSES;

/**
 * Session model wrapping a validated Notion agent session with helper methods.
 *
 * @category Agents
 */
export class Session extends BaseModel<NotionSession> {
  constructor(data: unknown, trusted?: typeof TRUSTED) {
    super(data as NotionSession, sessionSchema, trusted);
  }

  /**
   * Returns "session" - the object type.
   */
  get object(): 'session' {
    return this.data.object;
  }

  /**
   * Returns the session ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the ID of the agent for this session.
   */
  get agentId(): string {
    return this.data.agent_id;
  }

  /**
   * Returns the session title.
   */
  get title(): string {
    return this.data.title;
  }

  /**
   * Returns the session status. Notion can add new statuses. A status that this SDK does not
   * know is not running, does not require action, and does not end the turn.
   */
  get status(): ResponseSessionStatus {
    return this.data.status;
  }

  /**
   * Returns the actions that the agent waits for. Returns an empty array when there are none.
   */
  get requiredActions(): RequiredAction[] {
    return this.data.required_actions ?? [];
  }

  /**
   * Returns the session error, if the session failed.
   */
  get error(): SessionError | undefined {
    return this.data.error;
  }

  /**
   * Returns the premium AI credits that the session used. The send and cancel responses do not
   * include this value.
   */
  get creditsUsed(): number | null | undefined {
    return this.data.credits_used;
  }

  /**
   * Returns the creation time as a Date object.
   */
  get createdAt(): Date {
    return new Date(this.data.created_at);
  }

  /**
   * Returns the last update time as a Date object.
   */
  get updatedAt(): Date {
    return new Date(this.data.updated_at);
  }

  /**
   * Check if the agent still works on the current turn (`queued` or `in_progress`).
   */
  isRunning(): boolean {
    return this.data.status === 'queued' || this.data.status === 'in_progress';
  }

  /**
   * Check if the agent waits for you to submit actions.
   */
  requiresAction(): boolean {
    return this.data.status === 'requires_action';
  }

  /**
   * Check if the current turn is over and the agent waits for no action: `completed`, `failed`,
   * `canceled`, or `terminated`. The session stays open. To continue, send a message with
   * `session_id`. Notion does not document whether a `failed`, `canceled`, or `terminated`
   * session accepts a new message. If it does not, the send throws `NotionAPIError`.
   */
  isTurnOver(): boolean {
    return TURN_END_STATUSES.includes(this.data.status);
  }
}
