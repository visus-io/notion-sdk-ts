import { describe, expect, it } from 'vitest';
import { Session } from './session.model';
import { AGENT_ID, buildSessionResponse, SESSION_ID } from '../testUtils/fixtures';

describe('Session', () => {
  it('should expose the session fields', () => {
    const session = new Session(buildSessionResponse());

    expect(session.object).toBe('session');
    expect(session.id).toBe(SESSION_ID);
    expect(session.agentId).toBe(AGENT_ID);
    expect(session.title).toBe('Weekly summary');
    expect(session.status).toBe('completed');
    expect(session.creditsUsed).toBe(1.25);
    expect(session.requiredActions).toEqual([]);
    expect(session.error).toBeUndefined();
    expect(session.createdAt).toEqual(new Date('2026-11-01T12:00:00.000Z'));
    expect(session.updatedAt).toEqual(new Date('2026-11-01T12:01:00.000Z'));
  });

  it.each([
    ['queued', true, false, false],
    ['in_progress', true, false, false],
    ['requires_action', false, true, false],
    ['completed', false, false, true],
    ['failed', false, false, true],
    ['canceled', false, false, true],
    ['terminated', false, false, true],
  ] as const)(
    'should classify %s (running=%s, requiresAction=%s, terminal=%s)',
    (status, running, requiresAction, terminal) => {
      const session = new Session(buildSessionResponse({ status }));

      expect(session.isRunning()).toBe(running);
      expect(session.requiresAction()).toBe(requiresAction);
      expect(session.isTerminal()).toBe(terminal);
    },
  );

  it('should treat a status that Notion adds later as not running, not waiting, and not terminal', () => {
    const session = new Session(buildSessionResponse({ status: 'paused' }));

    expect(session.status).toBe('paused');
    expect(session.isRunning()).toBe(false);
    expect(session.requiresAction()).toBe(false);
    expect(session.isTerminal()).toBe(false);
  });

  it('should return the required actions', () => {
    const actions = [
      { action_id: 'act-1', title: 'Edit?', options: [{ id: 'approve' as const, label: 'OK' }] },
    ];
    const session = new Session(
      buildSessionResponse({ status: 'requires_action', required_actions: actions }),
    );

    expect(session.requiredActions).toEqual(actions);
  });
});
