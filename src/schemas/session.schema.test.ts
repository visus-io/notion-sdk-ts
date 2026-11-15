import { describe, expect, it } from 'vitest';
import { sessionSchema } from './session.schema';
import { sessionEventSchema } from './sessionEvent.schema';
import { sessionStreamEnvelopeSchema } from './sessionStream.schema';
import { buildSessionEventResponse, buildSessionResponse, SESSION_ID } from '../testUtils/fixtures';

describe('sessionSchema', () => {
  it('should parse a retrieved session', () => {
    const result = sessionSchema.parse(buildSessionResponse());

    expect(result.status).toBe('completed');
    expect(result.credits_used).toBe(1.25);
  });

  it('should parse a send response without created_by, models, or usage fields', () => {
    const result = sessionSchema.parse({
      object: 'session',
      id: SESSION_ID,
      agent_id: 'notion_ai',
      title: '',
      status: 'queued',
      created_at: '2026-11-01T12:00:00.000Z',
      updated_at: '2026-11-01T12:00:00.000Z',
    });

    expect(result.status).toBe('queued');
    expect(result.created_by).toBeUndefined();
  });

  it('should parse required actions and an error', () => {
    const result = sessionSchema.parse(
      buildSessionResponse({
        status: 'requires_action',
        required_actions: [
          {
            action_id: 'act-1',
            title: 'Edit page?',
            options: [
              { id: 'approve', label: 'Approve' },
              { id: 'reject', label: 'Reject' },
            ],
          },
        ],
        error: { code: 'tool_failed', message: 'Tool failed', retryable: true },
      }),
    );

    expect(result.required_actions?.[0].options).toHaveLength(2);
    expect(result.error?.retryable).toBe(true);
  });

  it('should parse pinned models', () => {
    const result = sessionSchema.parse(
      buildSessionResponse({ models: { type: 'pinned', ids: ['m1', null] } }),
    );

    expect(result.models).toEqual({ type: 'pinned', ids: ['m1', null] });
  });

  it('should accept a status and an action option that Notion adds later', () => {
    const result = sessionSchema.parse(
      buildSessionResponse({
        status: 'paused',
        required_actions: [
          { action_id: 'act-1', title: 'Edit?', options: [{ id: 'edit', label: 'Edit' }] },
        ],
      }),
    );

    expect(result.status).toBe('paused');
    expect(result.required_actions?.[0].options[0].id).toBe('edit');
  });

  it('should reject a status that is not a string', () => {
    expect(() => sessionSchema.parse({ ...buildSessionResponse(), status: 3 })).toThrow();
  });
});

describe('sessionEventSchema', () => {
  it.each([
    'user.message',
    'agent.message',
    'agent.thinking',
    'agent.tool_use',
    'agent.tool_result',
    'session.status',
  ])('should parse a %s event', (type) => {
    expect(sessionEventSchema.parse(buildSessionEventResponse(type)).type).toBe(type);
  });

  it('should keep whitespace in message text', () => {
    const result = sessionEventSchema.parse(
      buildSessionEventResponse('agent.message', {
        content: [{ type: 'text', text: '  indented\n' }],
      }),
    );

    expect(result.type === 'agent.message' && result.content[0]).toEqual({
      type: 'text',
      text: '  indented\n',
    });
  });

  it('should parse a file content item', () => {
    const result = sessionEventSchema.parse(
      buildSessionEventResponse('user.message', {
        content: [
          { type: 'file', name: 'a.pdf', content_type: 'application/pdf', url: 'https://x.test/a' },
        ],
      }),
    );

    expect(result.type === 'user.message' && result.content[0].type).toBe('file');
  });

  it.each(['queued', 'in_progress', 'requires_action', 'completed', 'paused'])(
    'should parse a session.status event with status %s',
    (status) => {
      const result = sessionEventSchema.parse(
        buildSessionEventResponse('session.status', { status }),
      );

      expect(result.type === 'session.status' && result.status).toBe(status);
    },
  );

  it("should map an unknown content type to type 'unknown' and keep the event", () => {
    const result = sessionEventSchema.parse(
      buildSessionEventResponse('agent.message', {
        content: [
          { type: 'text', text: 'Hi' },
          { type: 'image', url: 'https://x.test/a.png' },
        ],
      }),
    );

    expect(result.type === 'agent.message' && result.content[1]).toEqual({
      type: 'unknown',
      unknown_type: 'image',
      url: 'https://x.test/a.png',
    });
  });

  it('should reject a known content type with a missing field', () => {
    expect(() =>
      sessionEventSchema.parse(
        buildSessionEventResponse('agent.message', { content: [{ type: 'text' }] }),
      ),
    ).toThrow();
  });

  it("should map an unknown event type to type 'unknown' and keep the original", () => {
    const result = sessionEventSchema.parse(
      buildSessionEventResponse('agent.plan', { steps: [1] }),
    );

    expect(result.type).toBe('unknown');
    expect(result.type === 'unknown' && result.unknown_type).toBe('agent.plan');
    expect((result as Record<string, unknown>).steps).toEqual([1]);
  });

  it('should reject a known event type with a missing field', () => {
    expect(() =>
      sessionEventSchema.parse(buildSessionEventResponse('agent.tool_use', { tool_name: 1 })),
    ).toThrow();
  });
});

describe('sessionStreamEnvelopeSchema', () => {
  it('should parse every documented envelope type', () => {
    const envelopes = [
      { type: 'session.snapshot', session: buildSessionResponse({ status: 'in_progress' }) },
      { type: 'event.provisional', event: buildSessionEventResponse('agent.message') },
      { type: 'event.committed', event: buildSessionEventResponse('agent.message') },
      { type: 'stream.timeout', session_id: SESSION_ID, message: 'Reconnect' },
      { type: 'stream.end', session_id: SESSION_ID, status: 'completed' },
      {
        type: 'stream.error',
        session_id: SESSION_ID,
        error: { code: 'internal', message: 'Failed', retryable: false },
      },
    ];

    expect(envelopes.map((envelope) => sessionStreamEnvelopeSchema.parse(envelope).type)).toEqual(
      envelopes.map((envelope) => envelope.type),
    );
  });

  it('should parse a stream.end envelope with a status that Notion adds later', () => {
    const result = sessionStreamEnvelopeSchema.parse({
      type: 'stream.end',
      session_id: SESSION_ID,
      status: 'paused',
    });

    expect(result.type === 'stream.end' && result.status).toBe('paused');
  });

  it("should map an unknown envelope type to type 'unknown'", () => {
    const result = sessionStreamEnvelopeSchema.parse({ type: 'stream.heartbeat', at: 1 });

    expect(result).toEqual({ type: 'unknown', unknown_type: 'stream.heartbeat', at: 1 });
  });

  it('should reject a known envelope type with a missing payload', () => {
    expect(() => sessionStreamEnvelopeSchema.parse({ type: 'event.committed' })).toThrow();
  });
});
