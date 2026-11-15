import { BaseModel, type TRUSTED } from './base.model';
import {
  type AgentModelSelection,
  agentSchema,
  NOTION_AI_AGENT_ID,
  type NotionAgent,
  type ResponseAgentStatus,
} from '../schemas';

/**
 * Agent model wrapping a validated Notion agent object with helper methods.
 *
 * @category Agents
 */
export class Agent extends BaseModel<NotionAgent> {
  constructor(data: unknown, trusted?: typeof TRUSTED) {
    super(data as NotionAgent, agentSchema, trusted);
  }

  /**
   * Returns "agent" - the object type.
   */
  get object(): 'agent' {
    return this.data.object;
  }

  /**
   * Returns the agent ID. The personal agent has the ID `notion_ai`.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the agent name.
   */
  get name(): string {
    return this.data.name;
  }

  /**
   * Returns the agent type, for example `custom_agent` or `notion_ai`.
   */
  get agentType(): string {
    return this.data.agent_type;
  }

  /**
   * Returns the agent status. Notion can add new statuses. A status that this SDK does not know
   * is neither active nor deleted.
   */
  get status(): ResponseAgentStatus {
    return this.data.status;
  }

  /**
   * Returns why Notion paused the agent, or `null`/`undefined` when it is not paused.
   */
  get pauseReason(): string | null | undefined {
    return this.data.pause_reason;
  }

  /**
   * Returns the agent description.
   */
  get description(): string | null | undefined {
    return this.data.description;
  }

  /**
   * Returns the model selection: `auto`, or `pinned` with a model ID.
   */
  get model(): AgentModelSelection | undefined {
    return this.data.model;
  }

  /**
   * Returns the inline instructions. Notion sends them only when you set `verbose: true`.
   */
  get instructions(): string | null | undefined {
    return this.data.instructions;
  }

  /**
   * Returns the effective credit limit. `null` means no limit. `'hidden'` means that the token
   * has no edit access.
   */
  get creditLimit(): number | 'hidden' | null | undefined {
    return this.data.credit_limit;
  }

  /**
   * Returns the favorite state. Notion returns it only for a personal access token.
   */
  get isFavorited(): boolean | null | undefined {
    return this.data.is_favorited;
  }

  /**
   * Returns the creation time as a Date object, or `null` for the personal agent.
   */
  get createdTime(): Date | null {
    return this.data.created_time ? new Date(this.data.created_time) : null;
  }

  /**
   * Returns the last edit time as a Date object, or `null` for the personal agent.
   */
  get lastEditedTime(): Date | null {
    return this.data.last_edited_time ? new Date(this.data.last_edited_time) : null;
  }

  /**
   * Returns the last run time as a Date object. Returns `'hidden'` when the token has no edit
   * access, and `null` when the agent has not run.
   */
  get lastRunAt(): Date | 'hidden' | null {
    const value = this.data.last_run_at;
    if (value === 'hidden') {
      return value;
    }
    return value ? new Date(value) : null;
  }

  /**
   * Check if this is the personal agent (Notion AI).
   */
  isPersonalAgent(): boolean {
    return this.data.id === NOTION_AI_AGENT_ID || this.data.agent_type === NOTION_AI_AGENT_ID;
  }

  /**
   * Check if the agent is active.
   */
  isActive(): boolean {
    return this.data.status === 'active';
  }

  /**
   * Check if the agent is soft-deleted.
   */
  isDeleted(): boolean {
    return this.data.status === 'deleted';
  }
}
