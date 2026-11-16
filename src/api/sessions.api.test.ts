import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsAPI, type StreamSessionRequest } from './sessions.api';
import type { NotionClient } from '../client';
import { NotionAPIError, NotionNetworkError, NotionRequestTimeoutError } from '../errors';
import type { SseFrame } from '../sse';
import { buildSessionEventResponse, buildSessionResponse, SESSION_ID } from '../testUtils/fixtures';
import { NotionValidationError } from '../validation';

describe('SessionsAPI', () => {
  const mockClient = {
    request: vi.fn(),
    stream: vi.fn(),
  } as unknown as NotionClient;

  const sessionsAPI = new SessionsAPI(mockClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // send validation
  // ---------------------------------------------------------------------------

  describe('send', () => {
    it('should reject a message without agent_id or session_id', async () => {
      await expect(sessionsAPI.send({ message: 'Hi' })).rejects.toThrow(/agent_id/);
      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it('should accept a message at the 10,000-character limit and reject one over it', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(buildSessionResponse({ status: 'queued' }));

      await expect(
        sessionsAPI.send({ agent_id: 'a', message: 'x'.repeat(10_000) }),
      ).resolves.toBeDefined();
      await expect(
        sessionsAPI.send({ agent_id: 'a', message: 'x'.repeat(10_001) }),
      ).rejects.toThrow(/message exceeds the 10000-character limit/);
    });

    it('should reject a prompt_context over 10,000 characters', async () => {
      await expect(
        sessionsAPI.send({ agent_id: 'a', message: 'Hi', prompt_context: 'x'.repeat(10_001) }),
      ).rejects.toThrow(/prompt_context/);
    });

    it('should reject more than 100 attachments', async () => {
      const attachment = { file_upload: { id: 'f' } };
      await expect(
        sessionsAPI.send({
          agent_id: 'a',
          message: 'Hi',
          attachments: Array.from({ length: 101 }, () => attachment),
        }),
      ).rejects.toThrow(/attachments/);
    });

    it('should reject metadata with 21 keys or a value over 2,000 characters', async () => {
      const metadata = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, 'v']));

      await expect(sessionsAPI.send({ agent_id: 'a', message: 'Hi', metadata })).rejects.toThrow(
        /20-key limit/,
      );
      await expect(
        sessionsAPI.send({ agent_id: 'a', message: 'Hi', metadata: { k: 'v'.repeat(2_001) } }),
      ).rejects.toThrow(/metadata\.k/);
    });

    it('should reject a body that mixes message and actions', async () => {
      await expect(
        sessionsAPI.send({
          session_id: 's',
          message: 'Hi',
          actions: [{ action_id: 'a', option_id: 'approve' }],
        } as never),
      ).rejects.toThrow(/only one of/);
    });

    it('should reject empty actions and actions without session_id', async () => {
      await expect(sessionsAPI.send({ session_id: 's', actions: [] })).rejects.toThrow(
        /at least 1 item/,
      );
      await expect(
        sessionsAPI.send({ actions: [{ action_id: 'a', option_id: 'reject' }] } as never),
      ).rejects.toThrow(/actions requires session_id/);
    });

    it('should POST the message without a retry on 5xx', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(buildSessionResponse({ status: 'queued' }));

      await sessionsAPI.send({ agent_id: 'a', message: 'Hi' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/sessions',
        body: { agent_id: 'a', message: 'Hi' },
        retryOnServerError: false,
      });
    });

    it('should reject continue_from outside of stream()', async () => {
      await expect(
        sessionsAPI.send({ session_id: 's', continue_from: 'e' } as never),
      ).rejects.toThrow(/only with sessions.stream/);
    });
  });

  // ---------------------------------------------------------------------------
  // cancel
  // ---------------------------------------------------------------------------

  describe('cancel', () => {
    beforeEach(() => {
      vi.mocked(mockClient.request).mockResolvedValue(buildSessionResponse({ status: 'canceled' }));
    });

    it('should not allow a 5xx retry when no event_id is set', async () => {
      await sessionsAPI.cancel('s');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/sessions/s/cancel',
        body: {},
        retryOnServerError: false,
      });
    });

    it('should allow a 5xx retry when event_id is set', async () => {
      await sessionsAPI.cancel('s', { event_id: 'evt-1' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/sessions/s/cancel',
        body: { event_id: 'evt-1' },
        retryOnServerError: true,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // stream validation and parsing
  // ---------------------------------------------------------------------------

  describe('stream', () => {
    async function* frames(...data: string[]): AsyncGenerator<SseFrame> {
      for (const item of data) {
        yield { event: 'message', data: item };
      }
    }

    async function drain(request: StreamSessionRequest): Promise<void> {
      for await (const _envelope of sessionsAPI.stream(request)) {
        // Consume every envelope.
      }
    }

    it('should reject continue_from without session_id', async () => {
      await expect(drain({ continue_from: 'e' } as never)).rejects.toThrow(
        /continue_from requires session_id/,
      );
      expect(mockClient.stream).not.toHaveBeenCalled();
    });

    it('should throw NotionValidationError for data that is not JSON', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(frames('not json'));

      await expect(drain({ agent_id: 'a', message: 'Hi' })).rejects.toThrow(NotionValidationError);
    });

    it('should pass the signal and the request body to the client', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(
        frames(JSON.stringify({ type: 'stream.end', session_id: 's', status: 'completed' })),
      );
      const controller = new AbortController();

      for await (const _envelope of sessionsAPI.stream(
        { agent_id: 'a', message: 'Hi' },
        { signal: controller.signal },
      )) {
        // Consume every envelope.
      }

      expect(mockClient.stream).toHaveBeenCalledWith({
        method: 'POST',
        path: '/sessions',
        body: { agent_id: 'a', message: 'Hi' },
        signal: controller.signal,
        retryOnServerError: false,
        idleTimeoutMs: 300_000,
      });
    });

    it('should reject an idle timeout that is not a finite number', async () => {
      await expect(
        sessionsAPI.stream({ agent_id: 'a', message: 'Hi' }, { idleTimeoutMs: Number.NaN }).next(),
      ).rejects.toThrow(/idleTimeoutMs/);
      expect(mockClient.stream).not.toHaveBeenCalled();
    });

    it('should pass a custom idle timeout to the client', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(
        frames(JSON.stringify({ type: 'stream.end', session_id: 's', status: 'completed' })),
      );

      for await (const _envelope of sessionsAPI.stream(
        { agent_id: 'a', message: 'Hi' },
        { idleTimeoutMs: 0 },
      )) {
        // Consume every envelope.
      }

      expect(vi.mocked(mockClient.stream).mock.calls[0][0].idleTimeoutMs).toBe(0);
    });

    it('should not treat a message with continue_from undefined as a replay', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(
        frames(JSON.stringify({ type: 'stream.end', session_id: 's', status: 'completed' })),
      );

      await drain({ agent_id: 'a', message: 'Hi', continue_from: undefined } as never);

      expect(vi.mocked(mockClient.stream).mock.calls[0][0].retryOnServerError).toBe(false);
    });

    it('should allow a 5xx retry only for a replay', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(
        frames(JSON.stringify({ type: 'stream.end', session_id: 's', status: 'completed' })),
      );

      await drain({ session_id: 's', continue_from: 'evt-1' });

      expect(vi.mocked(mockClient.stream).mock.calls[0][0].retryOnServerError).toBe(true);
    });

    it('should throw NotionNetworkError when the stream ends early with no checkpoint', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(frames());

      await expect(drain({ agent_id: 'a', message: 'Hi' })).rejects.toBeInstanceOf(
        NotionNetworkError,
      );
      expect(mockClient.stream).toHaveBeenCalledTimes(1);
    });

    it('should resume from the last committed event when the stream ends early', async () => {
      const committed = {
        type: 'event.committed',
        event: buildSessionEventResponse('agent.message', { id: 'evt-7' }),
      };
      vi.mocked(mockClient.stream)
        .mockReturnValueOnce(frames(JSON.stringify(committed)))
        .mockReturnValueOnce(
          frames(
            JSON.stringify({ type: 'stream.end', session_id: SESSION_ID, status: 'completed' }),
          ),
        );

      await drain({ agent_id: 'a', message: 'Hi' });

      expect(vi.mocked(mockClient.stream).mock.calls[1][0].body).toEqual({
        session_id: SESSION_ID,
        continue_from: 'evt-7',
      });
    });

    it('should resume a replay request from its own continue_from after a timeout', async () => {
      vi.mocked(mockClient.stream)
        .mockReturnValueOnce(
          frames(JSON.stringify({ type: 'stream.timeout', session_id: 's', message: 'x' })),
        )
        .mockReturnValueOnce(
          frames(JSON.stringify({ type: 'stream.end', session_id: 's', status: 'completed' })),
        );

      await drain({ session_id: 's', continue_from: 'evt-5' });

      expect(vi.mocked(mockClient.stream).mock.calls[1][0].body).toEqual({
        session_id: 's',
        continue_from: 'evt-5',
      });
    });

    it('should show at most 200 characters of data that is not JSON', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(frames('x'.repeat(500)));

      await expect(drain({ agent_id: 'a', message: 'Hi' })).rejects.toThrow(
        `Session stream sent data that is not JSON: ${'x'.repeat(200)}…`,
      );
    });

    describe('wait before a resume', () => {
      const end = JSON.stringify({ type: 'stream.end', session_id: 's', status: 'completed' });

      function committed(id: string): string {
        return JSON.stringify({
          type: 'event.committed',
          event: buildSessionEventResponse('agent.message', { id }),
        });
      }

      async function* dropAfter(...data: string[]): AsyncGenerator<SseFrame> {
        yield* frames(...data);
        throw new NotionNetworkError('socket hang up');
      }

      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should wait 1 second, then 2 seconds, between drops with no new committed event', async () => {
        vi.mocked(mockClient.stream)
          .mockReturnValueOnce(dropAfter(committed('evt-1')))
          .mockReturnValueOnce(dropAfter())
          .mockReturnValueOnce(frames(end));

        const done = drain({ agent_id: 'a', message: 'Hi' });

        await vi.advanceTimersByTimeAsync(999);
        expect(mockClient.stream).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(mockClient.stream).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1_999);
        expect(mockClient.stream).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(mockClient.stream).toHaveBeenCalledTimes(3);
        await done;
      });

      it('should reset the wait after a new committed event', async () => {
        vi.mocked(mockClient.stream)
          .mockReturnValueOnce(dropAfter(committed('evt-1')))
          .mockReturnValueOnce(dropAfter(committed('evt-2')))
          .mockReturnValueOnce(frames(end));

        const done = drain({ agent_id: 'a', message: 'Hi' });

        await vi.advanceTimersByTimeAsync(1_000);
        expect(mockClient.stream).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1_000);
        expect(mockClient.stream).toHaveBeenCalledTimes(3);
        await done;
      });

      it('should not wait before a resume after stream.timeout', async () => {
        vi.mocked(mockClient.stream)
          .mockReturnValueOnce(
            frames(
              committed('evt-1'),
              JSON.stringify({ type: 'stream.timeout', session_id: 's', message: 'x' }),
            ),
          )
          .mockReturnValueOnce(frames(end));

        const done = drain({ agent_id: 'a', message: 'Hi' });

        await vi.advanceTimersByTimeAsync(0);
        expect(mockClient.stream).toHaveBeenCalledTimes(2);
        await done;
      });

      it('should resume after a request timeout or a retryable API error on a reconnect', async () => {
        async function* failWith(error: Error): AsyncGenerator<SseFrame> {
          yield* frames();
          throw error;
        }
        const unavailable = new NotionAPIError({
          object: 'error',
          status: 503,
          code: 'service_unavailable',
          message: 'x',
        });
        vi.mocked(mockClient.stream)
          .mockReturnValueOnce(dropAfter(committed('evt-1')))
          .mockReturnValueOnce(failWith(new NotionRequestTimeoutError('slow')))
          .mockReturnValueOnce(failWith(unavailable))
          .mockReturnValueOnce(frames(end));

        const done = drain({ agent_id: 'a', message: 'Hi' });
        await vi.advanceTimersByTimeAsync(1_000 + 2_000 + 4_000);

        await done;
        expect(mockClient.stream).toHaveBeenCalledTimes(4);
        expect(vi.mocked(mockClient.stream).mock.calls[3][0].body).toEqual({
          session_id: SESSION_ID,
          continue_from: 'evt-1',
        });
      });

      it('should throw an API error that a retry cannot fix', async () => {
        async function* failWith(error: Error): AsyncGenerator<SseFrame> {
          yield* frames();
          throw error;
        }
        const notFound = new NotionAPIError({
          object: 'error',
          status: 404,
          code: 'object_not_found',
          message: 'x',
        });
        vi.mocked(mockClient.stream)
          .mockReturnValueOnce(dropAfter(committed('evt-1')))
          .mockReturnValueOnce(failWith(notFound));

        const done = drain({ agent_id: 'a', message: 'Hi' });
        const assertion = expect(done).rejects.toBe(notFound);
        await vi.advanceTimersByTimeAsync(1_000);

        await assertion;
      });

      it('should throw the abort reason when the signal aborts during the wait', async () => {
        vi.mocked(mockClient.stream).mockReturnValueOnce(dropAfter(committed('evt-1')));
        const controller = new AbortController();

        const done = (async () => {
          for await (const _envelope of sessionsAPI.stream(
            { agent_id: 'a', message: 'Hi' },
            { signal: controller.signal },
          )) {
            // Consume every envelope.
          }
        })();
        const assertion = expect(done).rejects.toThrow('stop');

        await vi.advanceTimersByTimeAsync(500);
        controller.abort(new Error('stop'));
        await assertion;
        expect(mockClient.stream).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // poll
  // ---------------------------------------------------------------------------

  describe('poll', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      [{ timeoutMs: Number.NaN }, /timeoutMs/],
      [{ timeoutMs: -1 }, /timeoutMs/],
      [{ intervalMs: Number.NaN }, /intervalMs/],
      [{ intervalMs: Number.POSITIVE_INFINITY }, /intervalMs/],
    ])('should reject %o before any request', async (options, message) => {
      await expect(sessionsAPI.poll('s', options)).rejects.toThrow(message);
      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it('should return a requires_action session', async () => {
      vi.mocked(mockClient.request)
        .mockResolvedValueOnce(buildSessionResponse({ status: 'queued' }))
        .mockResolvedValueOnce(buildSessionResponse({ status: 'requires_action' }));

      const promise = sessionsAPI.poll('s', { intervalMs: 500 });
      await vi.advanceTimersByTimeAsync(500);
      const session = await promise;

      expect(session.requiresAction()).toBe(true);
      expect(mockClient.request).toHaveBeenCalledTimes(2);
    });

    it('should throw NotionRequestTimeoutError when the session still runs at the deadline', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(
        buildSessionResponse({ status: 'in_progress' }),
      );

      const promise = sessionsAPI.poll('s', { timeoutMs: 1_500, intervalMs: 1_000 });
      const assertion = expect(promise).rejects.toThrow(NotionRequestTimeoutError);
      await vi.advanceTimersByTimeAsync(1_500);
      await assertion;

      // Retrieves at 0 ms, 1000 ms, and a final one at the 1500 ms deadline.
      expect(mockClient.request).toHaveBeenCalledTimes(3);
    });

    it('should retrieve once more at the deadline and return a session that just finished', async () => {
      vi.mocked(mockClient.request)
        .mockResolvedValueOnce(buildSessionResponse({ status: 'in_progress' }))
        .mockResolvedValueOnce(buildSessionResponse({ status: 'completed' }));

      const promise = sessionsAPI.poll('s', { timeoutMs: 500, intervalMs: 1_000 });
      await vi.advanceTimersByTimeAsync(500);
      const session = await promise;

      expect(session.status).toBe('completed');
      expect(mockClient.request).toHaveBeenCalledTimes(2);
    });

    it('should return a session with a status that Notion adds later', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(buildSessionResponse({ status: 'paused' }));

      const session = await sessionsAPI.poll('s');

      expect(session.status).toBe('paused');
      expect(mockClient.request).toHaveBeenCalledTimes(1);
    });

    it('should use an interval of at least 250 ms', async () => {
      vi.mocked(mockClient.request)
        .mockResolvedValueOnce(buildSessionResponse({ status: 'queued' }))
        .mockResolvedValueOnce(buildSessionResponse({ status: 'completed' }));

      const promise = sessionsAPI.poll('s', { intervalMs: 1 });
      await vi.advanceTimersByTimeAsync(249);
      expect(mockClient.request).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await promise;

      expect(mockClient.request).toHaveBeenCalledTimes(2);
    });
  });
});
