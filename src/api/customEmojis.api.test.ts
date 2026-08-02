import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomEmojisAPI } from './customEmojis.api';
import type { NotionClient } from '../client';
import { CustomEmoji } from '../models';

describe('CustomEmojisAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const customEmojisAPI = new CustomEmojisAPI(mockClient);

  const mockPaginatedResponse = {
    object: 'list',
    results: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'party-parrot',
        url: 'https://example.com/party-parrot.png',
      },
    ],
    next_cursor: null,
    has_more: false,
    type: 'custom_emoji',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should list custom emojis', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      const result = await customEmojisAPI.list();

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/custom_emojis',
        query: undefined,
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(CustomEmoji);
    });

    it('should send name as a query param', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      await customEmojisAPI.list({ name: 'party-parrot' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/custom_emojis',
        query: { name: 'party-parrot' },
      });
    });

    it('should send pagination params', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      await customEmojisAPI.list({ page_size: 50, start_cursor: 'cursor123' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/custom_emojis',
        query: { page_size: '50', start_cursor: 'cursor123' },
      });
    });
  });
});
