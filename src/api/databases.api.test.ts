import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabasesAPI } from './databases.api';
import type { NotionClient } from '../client';
import { Database, Page } from '../models';
import { NotionValidationError } from '../validation';

describe('DatabasesAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const databasesAPI = new DatabasesAPI(mockClient);

  const mockDatabaseResponse = {
    object: 'database',
    id: '123e4567-e89b-12d3-a456-426614174000',
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
      Name: {
        id: 'title',
        name: 'Name',
        type: 'title',
        title: {},
      },
    },
    parent: { type: 'page_id', page_id: '523e4567-e89b-12d3-a456-426614174000' },
    url: 'https://notion.so/test-database',
    archived: false,
    in_trash: false,
    is_inline: false,
    public_url: null,
  };

  const mockPageResponse = {
    object: 'page',
    id: '223e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    archived: false,
    in_trash: false,
    icon: null,
    cover: null,
    parent: { type: 'database_id', database_id: '123e4567-e89b-12d3-a456-426614174000' },
    properties: {
      Name: {
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

  const mockPaginatedPageResponse = {
    object: 'list',
    results: [mockPageResponse],
    next_cursor: null,
    has_more: false,
    type: 'page',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retrieve', () => {
    it('should retrieve a database by ID', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      const result = await databasesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        query: undefined,
      });
      expect(result).toBeInstanceOf(Database);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should retrieve a database with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      await databasesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['prop1', 'prop2'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        query: { filter_properties: 'prop1,prop2' },
      });
    });

    it('should throw validation error when filter_properties exceeds limit', async () => {
      const tooManyProperties = new Array(101).fill('prop');

      await expect(
        databasesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
          filter_properties: tooManyProperties,
        }),
      ).rejects.toThrow(NotionValidationError);
    });
  });

  describe('query', () => {
    it('should query a database without options', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      const result = await databasesAPI.query('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000/query',
        body: undefined,
      });
      expect(result.object).toBe('list');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Page);
      expect(result.type).toBe('page');
    });

    it('should query a database with filter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      const filter = {
        property: 'Status',
        select: { equals: 'Done' },
      };

      await databasesAPI.query('123e4567-e89b-12d3-a456-426614174000', { filter });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000/query',
        body: { filter },
      });
    });

    it('should query a database with sorts', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      const sorts = [
        { property: 'Name', direction: 'ascending' as const },
        { timestamp: 'created_time' as const, direction: 'descending' as const },
      ];

      await databasesAPI.query('123e4567-e89b-12d3-a456-426614174000', { sorts });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000/query',
        body: { sorts },
      });
    });

    it('should query a database with pagination parameters', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await databasesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        page_size: 50,
        start_cursor: 'cursor123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          page_size: 50,
          start_cursor: 'cursor123',
        },
      });
    });

    it('should query a database with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await databasesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['Name', 'Status'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          filter_properties: ['Name', 'Status'],
        },
      });
    });

    it('should throw validation error when filter_properties exceeds limit', async () => {
      const tooManyProperties = new Array(101).fill('prop');

      await expect(
        databasesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
          filter_properties: tooManyProperties,
        }),
      ).rejects.toThrow(NotionValidationError);
    });
  });

  describe('create', () => {
    it('should create a database with page parent', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      const result = await databasesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: {
          Name: { title: {} },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: {
            Name: { title: {} },
          },
        },
      });
      expect(result).toBeInstanceOf(Database);
    });

    it('should create a database with title and description', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      const title = [{ type: 'text', text: { content: 'My Database' } }];
      const description = [{ type: 'text', text: { content: 'A test database' } }];

      await databasesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: { Name: { title: {} } },
        title,
        description,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: { Name: { title: {} } },
          title,
          description,
        },
      });
    });

    it('should throw validation error when title array exceeds limit', async () => {
      const tooManyTitleElements = new Array(101).fill({ type: 'text', text: { content: 'x' } });

      await expect(
        databasesAPI.create({
          parent: { page_id: 'parent-page-id' },
          properties: { Name: { title: {} } },
          title: tooManyTitleElements,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should throw validation error when description array exceeds limit', async () => {
      const tooManyDescriptionElements = new Array(101).fill({
        type: 'text',
        text: { content: 'x' },
      });

      await expect(
        databasesAPI.create({
          parent: { page_id: 'parent-page-id' },
          properties: { Name: { title: {} } },
          description: tooManyDescriptionElements,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should create a database with icon and cover', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      await databasesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: { Name: { title: {} } },
        icon: { type: 'emoji', emoji: '📊' },
        cover: { type: 'external', external: { url: 'https://example.com/cover.jpg' } },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: { Name: { title: {} } },
          icon: { type: 'emoji', emoji: '📊' },
          cover: { type: 'external', external: { url: 'https://example.com/cover.jpg' } },
        },
      });
    });

    it('should create an inline database', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      await databasesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: { Name: { title: {} } },
        is_inline: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/databases',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: { Name: { title: {} } },
          is_inline: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update database properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      const result = await databasesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        properties: {
          Status: {
            select: {
              options: [{ name: 'Todo' }, { name: 'In Progress' }, { name: 'Done' }],
            },
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        body: {
          properties: {
            Status: {
              select: {
                options: [{ name: 'Todo' }, { name: 'In Progress' }, { name: 'Done' }],
              },
            },
          },
        },
      });
      expect(result).toBeInstanceOf(Database);
    });

    it('should update database title and description', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      const title = [{ type: 'text', text: { content: 'Updated Database' } }];
      const description = [{ type: 'text', text: { content: 'Updated description' } }];

      await databasesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        title,
        description,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        body: { title, description },
      });
    });

    it('should throw validation error when title array exceeds limit', async () => {
      const tooManyTitleElements = new Array(101).fill({ type: 'text', text: { content: 'x' } });

      await expect(
        databasesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
          title: tooManyTitleElements,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should throw validation error when description array exceeds limit', async () => {
      const tooManyDescriptionElements = new Array(101).fill({
        type: 'text',
        text: { content: 'x' },
      });

      await expect(
        databasesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
          description: tooManyDescriptionElements,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should archive a database', async () => {
      const archivedDatabase = { ...mockDatabaseResponse, archived: true };
      vi.mocked(mockClient.request).mockResolvedValue(archivedDatabase);

      await databasesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        archived: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: true },
      });
    });

    it('should move database to trash', async () => {
      const trashedDatabase = { ...mockDatabaseResponse, in_trash: true };
      vi.mocked(mockClient.request).mockResolvedValue(trashedDatabase);

      await databasesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        in_trash: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        body: { in_trash: true },
      });
    });
  });

  describe('archive', () => {
    it('should archive a database using convenience method', async () => {
      const archivedDatabase = { ...mockDatabaseResponse, archived: true };
      vi.mocked(mockClient.request).mockResolvedValue(archivedDatabase);

      const result = await databasesAPI.archive('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: true },
      });
      expect(result).toBeInstanceOf(Database);
    });
  });

  describe('restore', () => {
    it('should restore an archived database using convenience method', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDatabaseResponse);

      const result = await databasesAPI.restore('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/databases/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: false },
      });
      expect(result).toBeInstanceOf(Database);
    });
  });
});
