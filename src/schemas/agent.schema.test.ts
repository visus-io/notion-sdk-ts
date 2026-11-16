import { describe, expect, it } from 'vitest';
import {
  agentBatchResultSchema,
  agentCreditLimitResultSchema,
  agentDeleteResultSchema,
  agentInsightsSchema,
  agentSchema,
} from './agent.schema';
import {
  buildAgentInsightsResponse,
  buildAgentResponse,
  buildPersonalAgentResponse,
} from '../testUtils/fixtures';

describe('agentSchema', () => {
  it('should parse a Custom Agent', () => {
    const result = agentSchema.parse(buildAgentResponse());

    expect(result.agent_type).toBe('custom_agent');
    expect(result.model).toEqual({ mode: 'auto' });
    expect(result.credit_limit).toBe(500);
  });

  it('should parse the personal agent with null fields', () => {
    const result = agentSchema.parse(buildPersonalAgentResponse());

    expect(result.id).toBe('notion_ai');
    expect(result.model).toEqual({ mode: 'pinned', id: 'model-1' });
    expect(result.created_time).toBeNull();
  });

  it("should accept 'hidden' for fields that need edit access", () => {
    const result = agentSchema.parse(
      buildAgentResponse({
        last_run_at: 'hidden',
        credit_limit: 'hidden',
        has_unpublished_changes: 'hidden',
      }),
    );

    expect(result.last_run_at).toBe('hidden');
    expect(result.credit_limit).toBe('hidden');
  });

  it('should keep unknown keys and accept an unknown agent type', () => {
    const result = agentSchema.parse({
      ...buildAgentResponse({ agent_type: 'future_agent' }),
      future_field: 1,
    });

    expect(result.agent_type).toBe('future_agent');
    expect((result as Record<string, unknown>).future_field).toBe(1);
  });

  it('should keep the whitespace of inline instructions', () => {
    const instructions = '    indented code\n\nBe brief.\n';

    expect(agentSchema.parse(buildAgentResponse({ instructions })).instructions).toBe(instructions);
  });

  it('should accept a status that Notion adds later', () => {
    expect(agentSchema.parse({ ...buildAgentResponse(), status: 'archived' }).status).toBe(
      'archived',
    );
  });

  it('should accept a model mode that Notion adds later', () => {
    expect(agentSchema.parse(buildAgentResponse({ model: { mode: 'fallback' } })).model).toEqual({
      mode: 'fallback',
    });
  });

  it('should reject a model mode that is not a string', () => {
    expect(() => agentSchema.parse(buildAgentResponse({ model: { mode: 1 } }))).toThrow();
  });

  it('should reject a status that is not a string', () => {
    expect(() => agentSchema.parse({ ...buildAgentResponse(), status: 1 })).toThrow();
  });
});

describe('agent result schemas', () => {
  it('should parse agent insights', () => {
    expect(agentInsightsSchema.parse(buildAgentInsightsResponse()).total_credits_used).toBe(42);
  });

  it('should accept an insights status that Notion adds later', () => {
    expect(
      agentInsightsSchema.parse({ ...buildAgentInsightsResponse(), status: 'archived' }).status,
    ).toBe('archived');
  });

  it('should parse a delete result', () => {
    const result = agentDeleteResultSchema.parse({
      agent_id: 'a',
      status: 'deleted',
      deleted_at: '2026-11-01T00:00:00.000Z',
    });

    expect(result.status).toBe('deleted');
  });

  it('should parse a cleared credit limit', () => {
    const result = agentCreditLimitResultSchema.parse({
      agent_id: 'a',
      credit_limit: null,
      last_edited_time: '2026-11-01T00:00:00.000Z',
    });

    expect(result.credit_limit).toBeNull();
  });

  it('should parse a batch result', () => {
    const result = agentBatchResultSchema.parse({
      object: 'agent_batch_result',
      results: [
        { index: 0, action: 'delete', agent_id: 'a', outcome: { status: 'deleted' } },
        { index: 1, action: 'update_status', agent_id: 'b', outcome: { error: { code: 'x' } } },
      ],
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].outcome).toEqual({ status: 'deleted' });
  });
});
