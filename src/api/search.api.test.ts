import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchAPI } from './search.api';
import type { NotionClient } from '../client';
import { Database, Page } from '../models';

describe('SearchAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const searchAPI = new SearchAPI(mockClient);

  const mockPageResponse = {
    object: 'page',
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    archived: false,
    in_trash: false,
    icon: null,
    cover: null,
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: { content: 'Test Page', link: null },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: 'Test Page',
            href: null,
          },
        ],
      },
    },
    url: 'https://notion.so/test',
    public_url: null,
  };

  const mockDatabaseResponse = {
    object: 'database',
    id: '223e4567-e89b-12d3-a456-426614174000',
    data_sources: [],
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    title: [
      {
        type: 'text',
        text: { content: 'Test Database', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Test Database',
        href: null,
      },
    ],
    description: [],
    icon: null,
    cover: null,
    properties: {
      Name: { id: 'title', name: 'Name', type: 'title', title: {} },
    },
    parent: { type: 'page_id', page_id: '523e4567-e89b-12d3-a456-426614174000' },
    url: 'https://notion.so/test-database',
    archived: false,
    in_trash: false,
    is_inline: false,
    public_url: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query', () => {
    it('should search without options', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      const result = await searchAPI.query();

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/search',
        body: undefined,
      });
      expect(result.object).toBe('list');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Page);
      expect(result.type).toBe('page_or_database');
    });

    it('should search with query string', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      await searchAPI.query({ query: 'test search' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/search',
        body: {
          query: 'test search',
        },
      });
    });

    it('should search with filter for pages only', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      await searchAPI.query({
        filter: {
          value: 'page',
          property: 'object',
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/search',
        body: {
          filter: {
            value: 'page',
            property: 'object',
          },
        },
      });
    });

    it('should search with filter for databases only', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockDatabaseResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      const result = await searchAPI.query({
        filter: {
          value: 'database',
          property: 'object',
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/search',
        body: {
          filter: {
            value: 'database',
            property: 'object',
          },
        },
      });
      expect(result.results[0]).toBeInstanceOf(Database);
    });

    it('should search with sort configuration', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      await searchAPI.query({
        sort: {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/search',
        body: {
          sort: {
            timestamp: 'last_edited_time',
            direction: 'descending',
          },
        },
      });
    });

    it('should search with pagination parameters', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      await searchAPI.query({
        page_size: 50,
        start_cursor: 'cursor123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/search',
        body: {
          page_size: 50,
          start_cursor: 'cursor123',
        },
      });
    });

    it('should search with all options combined', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      await searchAPI.query({
        query: 'project',
        filter: { value: 'page', property: 'object' },
        sort: { timestamp: 'last_edited_time', direction: 'ascending' },
        page_size: 25,
        start_cursor: 'cursor-abc',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/search',
        body: {
          query: 'project',
          filter: { value: 'page', property: 'object' },
          sort: { timestamp: 'last_edited_time', direction: 'ascending' },
          page_size: 25,
          start_cursor: 'cursor-abc',
        },
      });
    });

    it('should handle mixed page and database results', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse, mockDatabaseResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      const result = await searchAPI.query();

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toBeInstanceOf(Page);
      expect(result.results[1]).toBeInstanceOf(Database);
    });

    it('should handle pagination response', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockPageResponse],
        next_cursor: 'next-cursor-123',
        has_more: true,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      const result = await searchAPI.query();

      expect(result.next_cursor).toBe('next-cursor-123');
      expect(result.has_more).toBe(true);
    });

    it('should parse each result by its object type', async () => {
      const mockResponse = {
        object: 'list',
        results: [mockDatabaseResponse, mockPageResponse, mockDatabaseResponse],
        next_cursor: null,
        has_more: false,
      };
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse);

      const result = await searchAPI.query();

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toBeInstanceOf(Database);
      expect(result.results[1]).toBeInstanceOf(Page);
      expect(result.results[2]).toBeInstanceOf(Database);
    });
  });
});
