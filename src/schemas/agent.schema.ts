import * as z from 'zod';
import { notionDateStringSchema, type OpenEnum, openEnumSchema } from './shared.schema';

/**
 * Agent schemas.
 *
 * An agent is a Custom Agent or the personal agent (Notion AI) of the token's user. The agent
 * object has many connector-specific fields. Notion can add new fields and new values, so these
 * schemas keep unknown keys. Values that Notion can extend accept any string.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/notion-agent-apis/retrieve-agent
 */

/**
 * The agent ID of the personal agent. Only a personal access token can use it.
 *
 * @category Agents
 */
export const NOTION_AI_AGENT_ID = 'notion_ai';

/**
 * @category Agents
 */
export const AGENT_STATUSES = ['active', 'disabled', 'deleted'] as const;
/**
 * @category Agents
 */
export type AgentStatus = (typeof AGENT_STATUSES)[number];

/**
 * An agent status in a response. It is one of {@link AGENT_STATUSES}, or a status that Notion
 * adds later.
 *
 * @category Agents
 */
export type ResponseAgentStatus = OpenEnum<AgentStatus>;

/** Agent statuses in responses. A status that Notion adds later is also valid. */
const agentStatusSchema = openEnumSchema(AGENT_STATUSES);

/**
 * Documented agent types. The schema accepts other strings too.
 *
 * @category Agents
 */
export const AGENT_TYPES = [
  'notion_ai',
  'custom_agent',
  'autofill_custom_agent',
  'external',
] as const;
/**
 * @category Agents
 */
export type AgentType = (typeof AGENT_TYPES)[number];

/** Notion returns `'hidden'` for some fields when the token has no edit access. */
const hiddenSchema = z.literal('hidden');

const agentCreatorSchema = z.looseObject({
  id: z.string().trim(),
  type: z.string().trim(),
});

const agentVersionSchema = z.looseObject({
  id: z.string().trim(),
  number: z.int(),
  published_at: z.string().trim().nullish(),
});

/**
 * Agent model selection.
 *
 * @category Agents
 */
export const agentModelSchema = z.union([
  z.looseObject({ mode: z.literal('auto') }),
  z.looseObject({ mode: z.literal('pinned'), id: z.string().trim().nullish() }),
  // A mode that Notion adds later. A known mode never matches this branch.
  z.looseObject({
    mode: z
      .string()
      .trim()
      .refine((mode) => mode !== 'auto' && mode !== 'pinned', {
        error: 'Known model modes must match their own schema',
      }),
  }),
]);
/**
 * @category Agents
 */
export type AgentModelSelection = z.infer<typeof agentModelSchema>;

const agentTriggerSchema = z.looseObject({
  type: z.string().trim(),
  enabled: z.boolean().optional(),
  schedule: z.unknown().optional(),
  config: z.unknown().optional(),
});

const agentConnectionSchema = z.looseObject({
  type: z.string().trim(),
  name: z.string().trim().nullish(),
});

/**
 * Agent object.
 *
 * @category Agents
 */
export const agentSchema = z.looseObject({
  object: z.literal('agent'),
  /** A UUID, or `notion_ai` for the personal agent. */
  id: z.string().trim(),
  /** Documented values: see {@link AGENT_TYPES}. Notion can add new values. */
  agent_type: openEnumSchema(AGENT_TYPES),
  name: z.string().trim(),
  description: z.string().trim().nullish(),
  icon: z.unknown().optional(),
  instructions_page_id: z.string().trim().nullish(),
  /** Inline instructions. Notion sends them only when `verbose` is `true`. */
  // eslint-disable-next-line zod/prefer-string-schema-with-trim -- instructions are content and must preserve whitespace from Notion API
  instructions: z.string().nullish(),
  model: agentModelSchema.optional(),
  /** Documented values: see {@link AGENT_STATUSES}. Notion can add new values. */
  status: agentStatusSchema,
  pause_reason: z.string().trim().nullish(),
  created_by: agentCreatorSchema.nullish(),
  agent_version: agentVersionSchema.nullish(),
  has_unpublished_changes: z.union([z.boolean(), hiddenSchema]).nullish(),
  created_time: notionDateStringSchema.nullish(),
  last_edited_time: notionDateStringSchema.nullish(),
  last_run_at: z.union([notionDateStringSchema, hiddenSchema]).nullish(),
  /** The effective credit limit. `null` means no limit. */
  credit_limit: z.union([z.int(), hiddenSchema]).nullish(),
  triggers: z.array(agentTriggerSchema).optional(),
  connections: z.array(agentConnectionSchema).optional(),
  /** A boolean for a personal access token. `null` for a connection token. */
  is_favorited: z.boolean().nullish(),
});
/**
 * @category Agents
 */
export type NotionAgent = z.infer<typeof agentSchema>;

/**
 * Agent insights for a time window.
 *
 * @category Agents
 */
export const agentInsightsSchema = z.looseObject({
  object: z.literal('agent_insights'),
  id: z.string().trim(),
  name: z.string().trim(),
  agent_type: z.string().trim(),
  /** Documented values: see {@link AGENT_STATUSES}. Notion can add new values. */
  status: agentStatusSchema,
  pause_reason: z.string().trim().nullish(),
  created_by: agentCreatorSchema.nullish(),
  /** Premium AI credits used in the window. */
  total_credits_used: z.number(),
  credit_limit: z.union([z.int(), hiddenSchema]).nullish(),
  runs_completed: z.number(),
});
/**
 * @category Agents
 */
export type AgentInsights = z.infer<typeof agentInsightsSchema>;

/**
 * Response of a delete agent request.
 *
 * @category Agents
 */
export const agentDeleteResultSchema = z.looseObject({
  agent_id: z.string().trim(),
  status: z.literal('deleted'),
  deleted_at: notionDateStringSchema,
});
/**
 * @category Agents
 */
export type AgentDeleteResult = z.infer<typeof agentDeleteResultSchema>;

/**
 * Response of an update agent credit limit request.
 *
 * @category Agents
 */
export const agentCreditLimitResultSchema = z.looseObject({
  agent_id: z.string().trim(),
  /** `null` means no limit. */
  credit_limit: z.int().nullable(),
  last_edited_time: notionDateStringSchema,
});
/**
 * @category Agents
 */
export type AgentCreditLimitResult = z.infer<typeof agentCreditLimitResultSchema>;

/**
 * The `result` of a succeeded agent batch task. Parse `AsyncTask.result` with this schema.
 * Each entry has the `index` of its operation in the request.
 *
 * @category Agents
 */
export const agentBatchResultSchema = z.looseObject({
  object: z.literal('agent_batch_result'),
  results: z.array(
    z.looseObject({
      index: z.int(),
      action: z.string().trim(),
      agent_id: z.string().trim(),
      outcome: z.looseObject({}),
    }),
  ),
});
/**
 * @category Agents
 */
export type AgentBatchResult = z.infer<typeof agentBatchResultSchema>;
