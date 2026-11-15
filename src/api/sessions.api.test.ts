import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsAPI, type StreamSessionRequest } from './sessions.api';
import type { NotionClient } from '../client';
import { NotionRequestTimeoutError } from '../errors';
import type { SseFrame } from '../sse';
import { buildSessionResponse } from '../testUtils/fixtures';
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

    it('should POST the message without a retry on 504', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(buildSessionResponse({ status: 'queued' }));

      await sessionsAPI.send({ agent_id: 'a', message: 'Hi' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/sessions',
        body: { agent_id: 'a', message: 'Hi' },
        retryOnGatewayTimeout: false,
      });
    });

    it('should reject continue_from outside of stream()', async () => {
      await expect(
        sessionsAPI.send({ session_id: 's', continue_from: 'e' } as never),
      ).rejects.toThrow(/only with sessions.stream/);
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
        retryOnGatewayTimeout: false,
      });
    });

    it('should allow a 504 retry only for a replay', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(
        frames(JSON.stringify({ type: 'stream.end', session_id: 's', status: 'completed' })),
      );

      await drain({ session_id: 's', continue_from: 'evt-1' });

      expect(vi.mocked(mockClient.stream).mock.calls[0][0].retryOnGatewayTimeout).toBe(true);
    });

    it('should end without an envelope when the server closes the stream with no end', async () => {
      vi.mocked(mockClient.stream).mockReturnValue(frames());

      await expect(drain({ agent_id: 'a', message: 'Hi' })).resolves.toBeUndefined();
      expect(mockClient.stream).toHaveBeenCalledTimes(1);
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
