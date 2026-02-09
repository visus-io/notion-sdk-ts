import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlocksAPI } from './blocks.api';
import type { NotionClient } from '../client';
import { Block } from '../models';
import { NotionValidationError } from '../validation';

describe('BlocksAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const blocksAPI = new BlocksAPI(mockClient);

  const mockBlockResponse = {
    object: 'block',
    id: '123e4567-e89b-12d3-a456-426614174000',
    parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
    type: 'paragraph',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    archived: false,
    in_trash: false,
    has_children: false,
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: { content: 'Test paragraph', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Test paragraph',
          href: null,
        },
      ],
      color: 'default',
    },
  };

  const mockPaginatedResponse = {
    object: 'list',
    results: [mockBlockResponse],
    next_cursor: null,
    has_more: false,
    type: 'block',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retrieve', () => {
    it('should retrieve a block by ID', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockBlockResponse);

      const result = await blocksAPI.retrieve('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000',
        query: undefined,
      });
      expect(result).toBeInstanceOf(Block);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should retrieve a block with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockBlockResponse);

      await blocksAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['prop1', 'prop2'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000',
        query: { filter_properties: 'prop1,prop2' },
      });
    });
  });

  describe('delete', () => {
    it('should delete a block by ID', async () => {
      const archivedBlock = { ...mockBlockResponse, archived: true };
      vi.mocked(mockClient.request).mockResolvedValue(archivedBlock);

      const result = await blocksAPI.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result).toBeInstanceOf(Block);
      expect(result.archived).toBe(true);
    });
  });

  describe('update', () => {
    it('should update a block', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockBlockResponse);

      const result = await blocksAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        archived: false,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: false },
      });
      expect(result).toBeInstanceOf(Block);
    });

    it('should update block type-specific properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockBlockResponse);

      await blocksAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        paragraph: {
          rich_text: [{ type: 'text', text: { content: 'Updated' } }],
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000',
        body: {
          paragraph: {
            rich_text: [{ type: 'text', text: { content: 'Updated' } }],
          },
        },
      });
    });
  });

  describe('children.list', () => {
    it('should list block children without pagination params', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      const result = await blocksAPI.children.list('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000/children',
        query: undefined,
      });
      expect(result.object).toBe('list');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Block);
      expect(result.type).toBe('block');
    });

    it('should list block children with pagination params', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      await blocksAPI.children.list('123e4567-e89b-12d3-a456-426614174000', {
        page_size: 50,
        start_cursor: 'cursor123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000/children',
        query: {
          page_size: '50',
          start_cursor: 'cursor123',
        },
      });
    });
  });

  describe('children.append', () => {
    it('should append children to a block', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      const children = [
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: 'New' } }] },
        },
      ];

      const result = await blocksAPI.children.append('123e4567-e89b-12d3-a456-426614174000', {
        children,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000/children',
        body: { children },
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Block);
    });

    it('should append children with after parameter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      const children = [
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: 'New' } }] },
        },
      ];

      await blocksAPI.children.append('123e4567-e89b-12d3-a456-426614174000', {
        children,
        after: 'block-id-123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/blocks/123e4567-e89b-12d3-a456-426614174000/children',
        body: {
          children,
          after: 'block-id-123',
        },
      });
    });

    it('should throw validation error when children array exceeds limit', async () => {
      const children = new Array(101).fill({
        type: 'paragraph',
        paragraph: { rich_text: [] },
      });

      await expect(
        blocksAPI.children.append('123e4567-e89b-12d3-a456-426614174000', { children }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should include pagination parameters in response', async () => {
      const paginatedResponse = {
        ...mockPaginatedResponse,
        next_cursor: 'next-cursor-123',
        has_more: true,
      };
      vi.mocked(mockClient.request).mockResolvedValue(paginatedResponse);

      const result = await blocksAPI.children.append('123e4567-e89b-12d3-a456-426614174000', {
        children: [{ type: 'paragraph', paragraph: { rich_text: [] } }],
      });

      expect(result.next_cursor).toBe('next-cursor-123');
      expect(result.has_more).toBe(true);
    });
  });
});
