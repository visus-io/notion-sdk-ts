import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersAPI } from './users.api';
import type { NotionClient } from '../client';
import { User } from '../models';

describe('UsersAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const usersAPI = new UsersAPI(mockClient);

  const mockUserResponse = {
    object: 'user',
    id: '123e4567-e89b-12d3-a456-426614174000',
    type: 'person',
    person: {
      email: 'test@example.com',
    },
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  const mockBotUserResponse = {
    object: 'user',
    id: '223e4567-e89b-12d3-a456-426614174000',
    type: 'bot',
    bot: {
      owner: {
        type: 'workspace',
        workspace: true,
      },
      workspace_name: 'Test Workspace',
    },
    name: 'Test Bot',
    avatar_url: null,
  };

  const mockPaginatedResponse = {
    object: 'list',
    results: [mockUserResponse, mockBotUserResponse],
    next_cursor: null,
    has_more: false,
    type: 'user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retrieve', () => {
    it('should retrieve a user by ID', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockUserResponse);

      const result = await usersAPI.retrieve('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/users/123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should retrieve a bot user', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockBotUserResponse);

      const result = await usersAPI.retrieve('223e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/users/223e4567-e89b-12d3-a456-426614174000',
      });
      expect(result).toBeInstanceOf(User);
      expect(result.type).toBe('bot');
    });
  });

  describe('list', () => {
    it('should list all users without pagination params', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      const result = await usersAPI.list();

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/users',
        query: undefined,
      });
      expect(result.object).toBe('list');
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toBeInstanceOf(User);
      expect(result.results[1]).toBeInstanceOf(User);
      expect(result.type).toBe('user');
    });

    it('should list users with pagination params', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      await usersAPI.list({
        page_size: 50,
        start_cursor: 'cursor123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/users',
        query: {
          page_size: '50',
          start_cursor: 'cursor123',
        },
      });
    });

    it('should handle pagination response', async () => {
      const paginatedResponse = {
        ...mockPaginatedResponse,
        next_cursor: 'next-cursor-123',
        has_more: true,
      };
      vi.mocked(mockClient.request).mockResolvedValue(paginatedResponse);

      const result = await usersAPI.list();

      expect(result.next_cursor).toBe('next-cursor-123');
      expect(result.has_more).toBe(true);
    });

    it('should list users with only page_size parameter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      await usersAPI.list({
        page_size: 25,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/users',
        query: {
          page_size: '25',
        },
      });
    });

    it('should list users with only start_cursor parameter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedResponse);

      await usersAPI.list({
        start_cursor: 'cursor-abc',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/users',
        query: {
          start_cursor: 'cursor-abc',
        },
      });
    });
  });

  describe('me', () => {
    it('should retrieve the bot user for the current token', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockBotUserResponse);

      const result = await usersAPI.me();

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/users/me',
      });
      expect(result).toBeInstanceOf(User);
      expect(result.type).toBe('bot');
    });

    it('should return user details for me endpoint', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockBotUserResponse);

      const result = await usersAPI.me();

      expect(result.id).toBe('223e4567-e89b-12d3-a456-426614174000');
      expect(result.name).toBe('Test Bot');
    });
  });
});
