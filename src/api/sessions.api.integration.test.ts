import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError, NotionNetworkError } from '../errors';
import { Session } from '../models';
import { Notion } from '../notion';
import type { SessionStreamEnvelope } from '../schemas';
import {
  AGENT_ID,
  buildErrorBody,
  buildSessionEventResponse,
  buildSessionResponse,
  buildSseBody,
  SESSION_ID,
} from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

const SESSIONS_URL = `${NOTION_TEST_BASE_URL}/v1/sessions`;

const sendResponse = {
  object: 'session',
  id: SESSION_ID,
  agent_id: AGENT_ID,
  title: '',
  status: 'queued',
  created_at: '2026-11-01T12:00:00.000Z',
  updated_at: '2026-11-01T12:00:00.000Z',
};

function sseResponse(frames: (Record<string, unknown> | string)[]): HttpResponse<string> {
  return new HttpResponse(buildSseBody(frames), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

const snapshot = { type: 'session.snapshot', session: { ...sendResponse, status: 'in_progress' } };
const committed = (id: string): Record<string, unknown> => ({
  type: 'event.committed',
  event: buildSessionEventResponse('agent.message', { id }),
});
const streamEnd = { type: 'stream.end', session_id: SESSION_ID, status: 'completed' };
const streamTimeout = { type: 'stream.timeout', session_id: SESSION_ID, message: 'Reconnect' };

async function collect(iterable: AsyncIterable<SessionStreamEnvelope>): Promise<string[]> {
  const types: string[] = [];
  for await (const envelope of iterable) {
    types.push(envelope.type);
  }
  return types;
}

describe('SessionsAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  // ---------------------------------------------------------------------------
  // send / retrieve / query / cancel
  // ---------------------------------------------------------------------------

  describe('send', () => {
    it('should POST a message and parse the queued session', async () => {
      let body: unknown;
      server.use(
        http.post(SESSIONS_URL, async ({ request }) => {
          expect(request.headers.get('Accept')).toBeNull();
          body = await request.json();
          return HttpResponse.json(sendResponse);
        }),
      );

      const session = await notion.sessions.send({
        agent_id: AGENT_ID,
        message: 'Summarize this week.',
        metadata: { source: 'test' },
      });

      expect(body).toEqual({
        agent_id: AGENT_ID,
        message: 'Summarize this week.',
        metadata: { source: 'test' },
      });
      expect(session).toBeInstanceOf(Session);
      expect(session.isRunning()).toBe(true);
    });

    it('should POST submitted actions', async () => {
      let body: unknown;
      server.use(
        http.post(SESSIONS_URL, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ...sendResponse, status: 'in_progress' });
        }),
      );

      await notion.sessions.send({
        session_id: SESSION_ID,
        actions: [{ action_id: 'act-1', option_id: 'approve' }],
      });

      expect(body).toEqual({
        session_id: SESSION_ID,
        actions: [{ action_id: 'act-1', option_id: 'approve' }],
      });
    });

    it('should not resend the message after a 504', async () => {
      let calls = 0;
      server.use(
        http.post(SESSIONS_URL, () => {
          calls++;
          return HttpResponse.json(buildErrorBody(504, 'gateway_timeout', 'Timeout'), {
            status: 504,
          });
        }),
      );

      await expect(
        notion.sessions.send({ agent_id: AGENT_ID, message: 'Hi' }),
      ).rejects.toBeInstanceOf(NotionAPIError);
      expect(calls).toBe(1);
    });

    it('should surface a 403 when workspace credits are exhausted', async () => {
      server.use(
        http.post(SESSIONS_URL, () =>
          HttpResponse.json(buildErrorBody(403, 'restricted_resource', 'Credits exhausted'), {
            status: 403,
          }),
        ),
      );

      await expect(
        notion.sessions.send({ agent_id: AGENT_ID, message: 'Hi' }),
      ).rejects.toBeInstanceOf(NotionAPIError);
    });
  });

  describe('retrieve', () => {
    it('should GET the session', async () => {
      server.use(
        http.get(`${SESSIONS_URL}/${SESSION_ID}`, () => HttpResponse.json(buildSessionResponse())),
      );

      const session = await notion.sessions.retrieve(SESSION_ID);

      expect(session.creditsUsed).toBe(1.25);
    });

    it('should surface a 404 for a session that the token cannot read', async () => {
      server.use(
        http.get(`${SESSIONS_URL}/${SESSION_ID}`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Not found'), { status: 404 }),
        ),
      );

      const error = await notion.sessions.retrieve(SESSION_ID).catch((e: unknown) => e);

      expect((error as NotionAPIError).isNotFound()).toBe(true);
    });
  });

  describe('query', () => {
    it('should POST the query and parse a list of sessions', async () => {
      let body: unknown;
      server.use(
        http.post(`${SESSIONS_URL}/query`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            object: 'list',
            type: 'session',
            session: {},
            results: [buildSessionResponse()],
            has_more: false,
            next_cursor: null,
          });
        }),
      );

      const result = await notion.sessions.query({
        filter: { property: 'agent_id', string: { equals: AGENT_ID } },
        start_cursor: null,
      });

      expect(body).toEqual({ filter: { property: 'agent_id', string: { equals: AGENT_ID } } });
      expect(result.type).toBe('session');
      expect(result.results[0]).toBeInstanceOf(Session);
    });
  });

  describe('cancel', () => {
    it('should POST an empty body when no event_id is set', async () => {
      let body: unknown;
      server.use(
        http.post(`${SESSIONS_URL}/${SESSION_ID}/cancel`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ...sendResponse, status: 'canceled' });
        }),
      );

      const session = await notion.sessions.cancel(SESSION_ID);

      expect(body).toEqual({});
      expect(session.status).toBe('canceled');
    });

    it('should send event_id', async () => {
      let body: unknown;
      server.use(
        http.post(`${SESSIONS_URL}/${SESSION_ID}/cancel`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ...sendResponse, status: 'canceled' });
        }),
      );

      await notion.sessions.cancel(SESSION_ID, { event_id: 'evt-1' });

      expect(body).toEqual({ event_id: 'evt-1' });
    });
  });

  // ---------------------------------------------------------------------------
  // events.query
  // ---------------------------------------------------------------------------

  describe('events.query', () => {
    it('should POST the filter and parse each event type', async () => {
      let body: unknown;
      server.use(
        http.post(`${SESSIONS_URL}/${SESSION_ID}/events/query`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            object: 'list',
            type: 'session_event',
            session_event: {},
            results: [
              buildSessionEventResponse('agent.message'),
              buildSessionEventResponse('agent.future'),
            ],
            has_more: false,
            next_cursor: null,
          });
        }),
      );

      const result = await notion.sessions.events.query(SESSION_ID, {
        filter: { property: 'type', event_type: { equals: 'agent.message' } },
        page_size: 50,
      });

      expect(body).toEqual({
        filter: { property: 'type', event_type: { equals: 'agent.message' } },
        page_size: 50,
      });
      expect(result.type).toBe('session_event');
      const [message, future] = result.results;
      expect(message.type === 'agent.message' && message.content[0]).toEqual({
        type: 'text',
        text: 'Here is the summary.',
      });
      expect(future.type === 'unknown' && future.unknown_type).toBe('agent.future');
    });
  });

  // ---------------------------------------------------------------------------
  // poll
  // ---------------------------------------------------------------------------

  describe('poll', () => {
    it('should retrieve until the session stops running', async () => {
      const statuses = ['queued', 'in_progress', 'completed'];
      server.use(
        http.get(`${SESSIONS_URL}/${SESSION_ID}`, () =>
          HttpResponse.json(buildSessionResponse({ status: statuses.shift() as 'completed' })),
        ),
      );

      const session = await notion.sessions.poll(SESSION_ID, { intervalMs: 1 });

      expect(session.status).toBe('completed');
      expect(statuses).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // stream
  // ---------------------------------------------------------------------------

  describe('stream', () => {
    it('should send Accept: text/event-stream and yield envelopes until stream.end', async () => {
      let body: unknown;
      server.use(
        http.post(SESSIONS_URL, async ({ request }) => {
          expect(request.headers.get('Accept')).toBe('text/event-stream');
          body = await request.json();
          return sseResponse([
            ': keepalive\n\n',
            snapshot,
            { type: 'event.provisional', event: buildSessionEventResponse('agent.message') },
            committed('evt-1'),
            streamEnd,
            committed('evt-after-end'),
          ]);
        }),
      );

      const envelopes: SessionStreamEnvelope[] = [];
      for await (const envelope of notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' })) {
        envelopes.push(envelope);
      }

      expect(body).toEqual({ agent_id: AGENT_ID, message: 'Hi' });
      expect(envelopes.map((envelope) => envelope.type)).toEqual([
        'session.snapshot',
        'event.provisional',
        'event.committed',
        'stream.end',
      ]);
      const last = envelopes[3];
      expect(last.type === 'stream.end' && last.status).toBe('completed');
    });

    it('should resume from the last committed event after stream.timeout', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(SESSIONS_URL, async ({ request }) => {
          bodies.push(await request.json());
          return bodies.length === 1
            ? sseResponse([snapshot, committed('evt-1'), committed('evt-2'), streamTimeout])
            : sseResponse([committed('evt-3'), streamEnd]);
        }),
      );

      const types = await collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' }));

      expect(bodies).toEqual([
        { agent_id: AGENT_ID, message: 'Hi' },
        { session_id: SESSION_ID, continue_from: 'evt-2' },
      ]);
      expect(types).toEqual([
        'session.snapshot',
        'event.committed',
        'event.committed',
        'event.committed',
        'stream.end',
      ]);
    });

    it('should resume after the connection drops mid-stream', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(SESSIONS_URL, async ({ request }) => {
          bodies.push(await request.json());
          if (bodies.length > 1) {
            return sseResponse([streamEnd]);
          }
          const encoder = new TextEncoder();
          let pulls = 0;
          const stream = new ReadableStream<Uint8Array>({
            async pull(controller) {
              pulls++;
              if (pulls === 1) {
                controller.enqueue(encoder.encode(buildSseBody([snapshot, committed('evt-1')])));
                return;
              }
              // Wait so that the client reads the first chunk before the connection drops.
              // An immediate error() discards the chunks that are still in the queue.
              await new Promise((resolve) => setTimeout(resolve, 20));
              controller.error(new Error('socket hang up'));
            },
          });
          return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
        }),
      );

      const types = await collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' }));

      expect(bodies[1]).toEqual({ session_id: SESSION_ID, continue_from: 'evt-1' });
      expect(types).toEqual(['session.snapshot', 'event.committed', 'stream.end']);
    });

    it('should yield stream.timeout and stop after maxResumes', async () => {
      let calls = 0;
      server.use(
        http.post(SESSIONS_URL, () => {
          calls++;
          return sseResponse([committed(`evt-${calls}`), streamTimeout]);
        }),
      );

      const types = await collect(
        notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' }, { maxResumes: 1 }),
      );

      expect(calls).toBe(2);
      expect(types).toEqual(['event.committed', 'event.committed', 'stream.timeout']);
    });

    it('should yield stream.timeout without a resume when autoResume is false', async () => {
      let calls = 0;
      server.use(
        http.post(SESSIONS_URL, () => {
          calls++;
          return sseResponse([committed('evt-1'), streamTimeout]);
        }),
      );

      const types = await collect(
        notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' }, { autoResume: false }),
      );

      expect(calls).toBe(1);
      expect(types).toEqual(['event.committed', 'stream.timeout']);
    });

    it('should resume when the body ends without an end envelope', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(SESSIONS_URL, async ({ request }) => {
          bodies.push(await request.json());
          return bodies.length === 1
            ? sseResponse([snapshot, committed('evt-1')])
            : sseResponse([streamEnd]);
        }),
      );

      const types = await collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' }));

      expect(bodies[1]).toEqual({ session_id: SESSION_ID, continue_from: 'evt-1' });
      expect(types).toEqual(['session.snapshot', 'event.committed', 'stream.end']);
    });

    it('should throw NotionNetworkError when the body ends early before a committed event', async () => {
      server.use(http.post(SESSIONS_URL, () => sseResponse([snapshot])));

      await expect(
        collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' })),
      ).rejects.toBeInstanceOf(NotionNetworkError);
    });

    it('should yield stream.timeout when no committed event arrived before it', async () => {
      server.use(http.post(SESSIONS_URL, () => sseResponse([snapshot, streamTimeout])));

      const types = await collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' }));

      expect(types).toEqual(['session.snapshot', 'stream.timeout']);
    });

    it('should yield stream.error without throwing and stop', async () => {
      server.use(
        http.post(SESSIONS_URL, () =>
          sseResponse([
            snapshot,
            {
              type: 'stream.error',
              session_id: SESSION_ID,
              error: { code: 'internal', message: 'Failed', retryable: true },
            },
            streamEnd,
          ]),
        ),
      );

      const types = await collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' }));

      expect(types).toEqual(['session.snapshot', 'stream.error']);
    });

    it('should send a replay body with continue_from', async () => {
      let body: unknown;
      server.use(
        http.post(SESSIONS_URL, async ({ request }) => {
          body = await request.json();
          return sseResponse([streamEnd]);
        }),
      );

      await collect(notion.sessions.stream({ session_id: SESSION_ID, continue_from: 'evt-9' }));

      expect(body).toEqual({ session_id: SESSION_ID, continue_from: 'evt-9' });
    });

    it('should throw NotionAPIError for an error status', async () => {
      server.use(
        http.post(SESSIONS_URL, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Not found'), { status: 404 }),
        ),
      );

      await expect(
        collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' })),
      ).rejects.toBeInstanceOf(NotionAPIError);
    });

    it('should throw NotionNetworkError when the first connection fails', async () => {
      server.use(http.post(SESSIONS_URL, () => HttpResponse.error()));

      await expect(
        collect(notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' })),
      ).rejects.toBeInstanceOf(NotionNetworkError);
    });

    it('should stop reading when the caller breaks out of the loop', async () => {
      server.use(
        http.post(SESSIONS_URL, () => sseResponse([snapshot, committed('evt-1'), streamEnd])),
      );

      const types: string[] = [];
      for await (const envelope of notion.sessions.stream({ agent_id: AGENT_ID, message: 'Hi' })) {
        types.push(envelope.type);
        break;
      }

      expect(types).toEqual(['session.snapshot']);
    });
  });
});
