import type { NotionClient } from '../client';
import { Agent, AsyncTask } from '../models';
import { TRUSTED } from '../models/base.model';
import {
  type AgentCreditLimitResult,
  agentCreditLimitResultSchema,
  type AgentDeleteResult,
  agentDeleteResultSchema,
  type AgentInsights,
  agentInsightsSchema,
  agentSchema,
  asyncTaskSchema,
  NOTION_AI_AGENT_ID,
  type NotionAgent,
  type PaginatedList,
} from '../schemas';
import { NotionValidationError } from '../validation';
import { buildAgentQueryBody, validateNonEmptyArray } from './agentQuery';
import { BaseAPI } from './base.api';

/**
 * Agent model selection in a request.
 */
export type AgentModelOption = { mode: 'auto' } | { mode: 'pinned'; id: string };

/**
 * A time range condition. Send `after`, `before`, or both.
 */
export interface AgentTimeRangeCondition {
  after?: string;
  before?: string;
}

/**
 * One property condition of an agent query filter. The condition key is the type of the
 * property, not its name. Example: `{ property: 'created_by', people: { contains: userId } }`.
 */
export type AgentPropertyFilter =
  | { property: 'id'; id: { equals: string } }
  | {
      property: 'agent_type';
      string: { equals: 'notion_ai' | 'custom_agent' | 'autofill_custom_agent' };
    }
  | { property: 'created_by'; people: { contains: string } }
  | { property: 'created_time'; date: AgentTimeRangeCondition }
  | { property: 'favorited'; checkbox: { equals: boolean } }
  | { property: 'connections'; mcp_server: { contains: string } }
  | { property: 'status'; status: { in: ('active' | 'disabled' | 'deleted')[] } }
  | { property: 'model_mode'; select: { equals: 'auto' | 'pinned' } }
  | { property: 'agent_version'; number: { equals: number } }
  | { property: 'last_run_at'; date: AgentTimeRangeCondition };

/**
 * Agent query filter: one property condition, or an `and`/`or` compound.
 */
export type AgentFilter = AgentPropertyFilter | { and: AgentFilter[] } | { or: AgentFilter[] };

/**
 * Sort item of an agent query.
 */
export interface AgentSort {
  property: 'created_time' | 'last_run_at';
  direction: 'ascending' | 'descending';
}

/**
 * Options for querying agents.
 */
export interface QueryAgentsOptions {
  /** Case-insensitive text match on the agent name and description (max 2000 characters) */
  query?: string;

  /** Filter conditions */
  filter?: AgentFilter;

  /** 1 or 2 sort items. The default is `created_time` descending. */
  sorts?: AgentSort[];

  /** The `next_cursor` of the previous page */
  start_cursor?: string | null;

  /** Agents per page (1 to 100) */
  page_size?: number;

  /** Include the inline instructions of each agent */
  verbose?: boolean;

  /** Include soft-deleted agents */
  include_deleted?: boolean;
}

/**
 * Options for retrieving an agent.
 */
export interface RetrieveAgentOptions {
  /** Include the inline instructions */
  verbose?: boolean;
}

/**
 * Options for updating an agent. Send at least one field.
 */
export interface UpdateAgentOptions {
  /** Enable or disable a Custom Agent. Not valid for `notion_ai`. */
  status?: 'active' | 'disabled';

  /** The display name */
  name?: string;

  /** The description of a Custom Agent. `''` clears it. Not valid for `notion_ai`. */
  description?: string;

  /** The favorite state. Only a personal access token can set it. */
  is_favorited?: boolean;

  /** The model selection. The model must be available to the token's user. */
  model?: AgentModelOption;
}

/**
 * One operation of an agent batch request.
 */
export type AgentBatchOperation =
  | { action: 'update_status'; agent_id: string; fields: { status: 'active' | 'disabled' } }
  | { action: 'update_credit_limit'; agent_id: string; fields: { credit_limit: number | null } }
  | { action: 'delete'; agent_id: string };

/**
 * Options for retrieving agent insights. Send both times, or neither. When you send neither,
 * the window is the current billing period.
 */
export interface AgentInsightsOptions {
  /** Start of the window, as a `Date` or as epoch seconds */
  start_time?: Date | number;

  /** End of the window, as a `Date` or as epoch seconds */
  end_time?: Date | number;
}

function toEpochSeconds(value: Date | number, label: string): number {
  const seconds = value instanceof Date ? Math.floor(value.getTime() / 1_000) : value;
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new NotionValidationError(`${label} must be a non-negative integer of epoch seconds`);
  }
  return seconds;
}

/**
 * @throws {NotionValidationError} If `creditLimit` is not a non-negative integer or `null`.
 */
function validateCreditLimit(creditLimit: number | null, label: string): void {
  if (creditLimit !== null && (!Number.isInteger(creditLimit) || creditLimit < 0)) {
    throw new NotionValidationError(`${label} must be a non-negative integer or null`);
  }
}

/**
 * @throws {NotionValidationError} If `agentId` is the personal agent.
 */
function rejectPersonalAgent(agentId: string, operation: string): void {
  if (agentId === NOTION_AI_AGENT_ID) {
    throw new NotionValidationError(`${operation} does not support the personal agent (notion_ai)`);
  }
}

/**
 * Agents API client for managing Custom Agents and the personal agent.
 *
 * A personal access token acts as you. It can use `notion_ai` as the agent ID. A connection
 * token can use only the agents shared with its connection.
 *
 * @category Agents
 */
export class AgentsAPI extends BaseAPI<NotionAgent, Agent> {
  protected config = {
    schema: agentSchema,
    ModelClass: Agent,
    listType: 'agent' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Query the agents that the token can access.
   *
   * @param options - Text query, filter, sorts, and pagination
   * @returns A paginated list of agents
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/query-agents
   */
  async query(options?: QueryAgentsOptions): Promise<PaginatedList<Agent>> {
    const body = buildAgentQueryBody(options, {
      verbose: options?.verbose,
      include_deleted: options?.include_deleted,
    });

    const response = await this.client.request<unknown>({
      method: 'POST',
      path: '/agents/query',
      body,
    });

    return this.parsePaginatedList(response);
  }

  /**
   * Retrieve an agent.
   *
   * @param agentId - The agent UUID, or `notion_ai` for the personal agent
   * @param options - Set `verbose: true` to include the inline instructions
   * @returns The agent wrapped in an Agent model
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/retrieve-agent
   */
  async retrieve(agentId: string, options?: RetrieveAgentOptions): Promise<Agent> {
    const query: Record<string, string> = {};
    if (options?.verbose !== undefined) {
      query.verbose = String(options.verbose);
    }

    return this.retrieveResource(`/agents/${agentId}`, query);
  }

  /**
   * Update the name, description, model, status, or favorite state of an agent.
   * Notion applies all fields, or none of them.
   *
   * @param agentId - The agent UUID, or `notion_ai` for the personal agent
   * @param options - The fields to change. Send at least one field.
   * @returns The updated agent wrapped in an Agent model
   *
   * @throws {NotionValidationError} If `options` has no fields.
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/update-agent
   */
  async update(agentId: string, options: UpdateAgentOptions): Promise<Agent> {
    const body = Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(body).length === 0) {
      throw new NotionValidationError('agents.update() requires at least one field');
    }

    return this.updateResource(`/agents/${agentId}`, body);
  }

  /**
   * Soft-delete a Custom Agent. Only a personal access token can delete an agent.
   *
   * @param agentId - The Custom Agent UUID
   * @returns The agent ID, the `deleted` status, and the delete time
   *
   * @throws {NotionValidationError} If `agentId` is `notion_ai`.
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/delete-agent
   */
  async delete(agentId: string): Promise<AgentDeleteResult> {
    rejectPersonalAgent(agentId, 'agents.delete()');

    const response = await this.client.request<unknown>({
      method: 'DELETE',
      path: `/agents/${agentId}`,
    });

    return agentDeleteResultSchema.parse(response);
  }

  /**
   * Set or clear the credit limit of a Custom Agent. Only a personal access token can change a
   * credit limit.
   *
   * @param agentId - The Custom Agent UUID
   * @param creditLimit - A non-negative integer, or `null` to clear the limit
   * @returns The agent ID, the current limit, and the edit time
   *
   * @throws {NotionValidationError} If `agentId` is `notion_ai`, or `creditLimit` is not valid.
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/update-agent-credit-limit
   */
  async updateCreditLimit(
    agentId: string,
    creditLimit: number | null,
  ): Promise<AgentCreditLimitResult> {
    rejectPersonalAgent(agentId, 'agents.updateCreditLimit()');
    validateCreditLimit(creditLimit, 'credit_limit');

    const response = await this.client.request<unknown>({
      method: 'PATCH',
      path: `/agents/${agentId}/credit_limit`,
      body: { credit_limit: creditLimit },
    });

    return agentCreditLimitResultSchema.parse(response);
  }

  /**
   * Apply up to 100 status, credit limit, and delete operations asynchronously.
   * The batch is not atomic. Each operation succeeds or fails on its own.
   *
   * Poll the returned task with `notion.asyncTasks.poll(task.id)`. Then parse `task.result`
   * with `agentBatchResultSchema`. Match each result to its operation by `index`.
   *
   * @param operations - The operations, in order (1 to 100)
   * @returns The async task wrapped in an AsyncTask model
   *
   * @throws {NotionValidationError} If `operations` is empty, has more than 100 items, or has a
   * credit limit that is not valid.
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/batch-manage-agent
   */
  async batch(operations: AgentBatchOperation[]): Promise<AsyncTask> {
    validateNonEmptyArray(operations, 'operations');
    operations.forEach((operation, index) => {
      if (operation.action === 'update_credit_limit') {
        validateCreditLimit(
          operation.fields.credit_limit,
          `operations[${index}].fields.credit_limit`,
        );
      }
    });

    const response = await this.client.request<unknown>({
      method: 'POST',
      path: '/agents/batch',
      body: { operations },
    });

    return new AsyncTask(asyncTaskSchema.parse(response), TRUSTED);
  }

  /**
   * Retrieve the credits used and the runs completed by an agent in a time window.
   *
   * @param agentId - The agent UUID, or `notion_ai` for the personal agent
   * @param options - The window. Omit it to use the current billing period.
   * @returns The agent insights
   *
   * @throws {NotionValidationError} If only one of `start_time` and `end_time` is set, or a
   * time is not valid.
   *
   * @see https://developers.notion.com/reference/notion-agent-apis/retrieve-agent-insights
   */
  async insights(agentId: string, options?: AgentInsightsOptions): Promise<AgentInsights> {
    const hasStart = options?.start_time !== undefined;
    const hasEnd = options?.end_time !== undefined;
    if (hasStart !== hasEnd) {
      throw new NotionValidationError('start_time and end_time must be sent together');
    }

    const query: Record<string, number> = {};
    if (options?.start_time !== undefined && options.end_time !== undefined) {
      query.start_time = toEpochSeconds(options.start_time, 'start_time');
      query.end_time = toEpochSeconds(options.end_time, 'end_time');
    }

    const response = await this.client.request<unknown>({
      method: 'GET',
      path: `/agents/${agentId}/insights`,
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    return agentInsightsSchema.parse(response);
  }
}
