import { describe, expect, it } from 'vitest';
import { Agent } from './agent.model';
import { buildAgentResponse, buildPersonalAgentResponse } from '../testUtils/fixtures';

describe('Agent', () => {
  it('should expose the agent fields', () => {
    const agent = new Agent(buildAgentResponse());

    expect(agent.object).toBe('agent');
    expect(agent.name).toBe('Triage Agent');
    expect(agent.agentType).toBe('custom_agent');
    expect(agent.status).toBe('active');
    expect(agent.description).toBe('Sorts incoming requests');
    expect(agent.model).toEqual({ mode: 'auto' });
    expect(agent.creditLimit).toBe(500);
    expect(agent.isFavorited).toBe(false);
    expect(agent.pauseReason).toBeNull();
    expect(agent.createdTime).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(agent.lastEditedTime).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    expect(agent.lastRunAt).toEqual(new Date('2026-11-01T12:00:00.000Z'));
    expect(agent.isActive()).toBe(true);
    expect(agent.isDeleted()).toBe(false);
    expect(agent.isPersonalAgent()).toBe(false);
  });

  it('should identify the personal agent and return null times', () => {
    const agent = new Agent(buildPersonalAgentResponse());

    expect(agent.isPersonalAgent()).toBe(true);
    expect(agent.createdTime).toBeNull();
    expect(agent.lastEditedTime).toBeNull();
    expect(agent.lastRunAt).toBeNull();
  });

  it("should return 'hidden' for a hidden last run time", () => {
    expect(new Agent(buildAgentResponse({ last_run_at: 'hidden' })).lastRunAt).toBe('hidden');
  });

  it('should report a deleted agent', () => {
    const agent = new Agent(buildAgentResponse({ status: 'deleted' }));

    expect(agent.isDeleted()).toBe(true);
    expect(agent.isActive()).toBe(false);
  });

  it('should treat a status that Notion adds later as neither active nor deleted', () => {
    const agent = new Agent(buildAgentResponse({ status: 'archived' }));

    expect(agent.status).toBe('archived');
    expect(agent.isActive()).toBe(false);
    expect(agent.isDeleted()).toBe(false);
  });

  it('should return verbose instructions', () => {
    expect(new Agent(buildAgentResponse({ instructions: 'Be brief.' })).instructions).toBe(
      'Be brief.',
    );
  });
});
