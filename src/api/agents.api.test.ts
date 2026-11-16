import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentsAPI } from './agents.api';
import type { NotionClient } from '../client';
import { buildAgentResponse } from '../testUtils/fixtures';
import { NotionValidationError } from '../validation';

describe('AgentsAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const agentsAPI = new AgentsAPI(mockClient);
  const emptyList = {
    object: 'list',
    type: 'agent',
    results: [],
    has_more: false,
    next_cursor: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // query validation
  // ---------------------------------------------------------------------------

  describe('query', () => {
    it('should send start_cursor and include_deleted, and omit a null cursor', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(emptyList);

      await agentsAPI.query({ start_cursor: 'c1', include_deleted: true });
      await agentsAPI.query({ start_cursor: null });

      expect(vi.mocked(mockClient.request).mock.calls[0][0].body).toEqual({
        start_cursor: 'c1',
        include_deleted: true,
      });
      expect(vi.mocked(mockClient.request).mock.calls[1][0].body).toEqual({});
    });

    it('should accept a query at the 2000-character limit and reject one over it', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(emptyList);

      await expect(agentsAPI.query({ query: 'a'.repeat(2_000) })).resolves.toBeDefined();
      await expect(agentsAPI.query({ query: 'a'.repeat(2_001) })).rejects.toThrow(
        NotionValidationError,
      );
    });

    it.each([0, 101, 1.5])('should reject page_size %s', async (pageSize) => {
      await expect(agentsAPI.query({ page_size: pageSize })).rejects.toThrow(NotionValidationError);
      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it('should reject 0 or 3 sorts and accept 2', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(emptyList);
      const sort = { property: 'created_time' as const, direction: 'ascending' as const };

      await expect(agentsAPI.query({ sorts: [] })).rejects.toThrow(/sorts must have 1 to 2/);
      await expect(agentsAPI.query({ sorts: [sort, sort, sort] })).rejects.toThrow(
        NotionValidationError,
      );
      await expect(agentsAPI.query({ sorts: [sort, sort] })).resolves.toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // retrieve / update
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should send no query without options and verbose=false when set', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(buildAgentResponse());

      await agentsAPI.retrieve('a');
      await agentsAPI.retrieve('a', { verbose: false });

      expect(vi.mocked(mockClient.request).mock.calls[0][0].query).toBeUndefined();
      expect(vi.mocked(mockClient.request).mock.calls[1][0].query).toEqual({ verbose: 'false' });
    });
  });

  describe('update', () => {
    it('should reject an update with no fields', async () => {
      await expect(agentsAPI.update('a', {})).rejects.toThrow(/at least one field/);
      await expect(agentsAPI.update('a', { name: undefined })).rejects.toThrow(
        NotionValidationError,
      );
      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it("should send description '' to clear it", async () => {
      vi.mocked(mockClient.request).mockResolvedValue(buildAgentResponse({ description: '' }));

      await agentsAPI.update('a', { description: '' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/agents/a',
        body: { description: '' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // delete / credit limit / batch / insights validation
  // ---------------------------------------------------------------------------

  describe('client-side checks', () => {
    it('should reject delete and updateCreditLimit for notion_ai', async () => {
      await expect(agentsAPI.delete('notion_ai')).rejects.toThrow(/personal agent/);
      await expect(agentsAPI.updateCreditLimit('notion_ai', 1)).rejects.toThrow(/personal agent/);
      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it.each([-1, 1.5, Number.NaN])('should reject credit limit %s', async (limit) => {
      await expect(agentsAPI.updateCreditLimit('a', limit)).rejects.toThrow(NotionValidationError);
    });

    it('should accept a credit limit of 0', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({
        agent_id: 'a',
        credit_limit: 0,
        last_edited_time: '2026-11-15T00:00:00.000Z',
      });

      await expect(agentsAPI.updateCreditLimit('a', 0)).resolves.toMatchObject({ credit_limit: 0 });
    });

    it('should reject an empty batch and a batch over 100 operations', async () => {
      const op = { action: 'delete' as const, agent_id: 'a' };

      await expect(agentsAPI.batch([])).rejects.toThrow(/at least 1 item/);
      await expect(agentsAPI.batch(Array.from({ length: 101 }, () => op))).rejects.toThrow(
        /100-element limit/,
      );
    });

    it('should reject a batch credit limit that is not valid and name its index', async () => {
      await expect(
        agentsAPI.batch([
          { action: 'delete', agent_id: 'a' },
          { action: 'update_credit_limit', agent_id: 'b', fields: { credit_limit: -5 } },
        ]),
      ).rejects.toThrow(/operations\[1\]\.fields\.credit_limit/);
    });

    it('should reject insights with only one time', async () => {
      await expect(agentsAPI.insights('a', { start_time: 1 })).rejects.toThrow(/together/);
      await expect(agentsAPI.insights('a', { end_time: new Date() })).rejects.toThrow(/together/);
    });

    it('should reject a negative or fractional epoch time', async () => {
      await expect(agentsAPI.insights('a', { start_time: -1, end_time: 2 })).rejects.toThrow(
        /start_time/,
      );
      await expect(agentsAPI.insights('a', { start_time: 1, end_time: 2.5 })).rejects.toThrow(
        /end_time/,
      );
    });

    it('should floor a Date to whole epoch seconds', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({
        object: 'agent_insights',
        id: 'a',
        name: 'A',
        agent_type: 'custom_agent',
        status: 'active',
        pause_reason: null,
        created_by: null,
        total_credits_used: 0,
        credit_limit: null,
        runs_completed: 0,
      });

      await agentsAPI.insights('a', { start_time: new Date(1_500), end_time: new Date(2_999) });

      expect(vi.mocked(mockClient.request).mock.calls[0][0].query).toEqual({
        start_time: 1,
        end_time: 2,
      });
    });
  });
});
