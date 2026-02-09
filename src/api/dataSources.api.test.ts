import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSourcesAPI } from './dataSources.api';
import type { NotionClient } from '../client';
import { DataSource, Page } from '../models';
import { NotionValidationError } from '../validation';

describe('DataSourcesAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const dataSourcesAPI = new DataSourcesAPI(mockClient);

  const mockDataSourceResponse = {
    object: 'data_source',
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    title: [
      {
        type: 'text',
        text: { content: 'Test Data Source', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Test Data Source',
        href: null,
      },
    ],
    description: [],
    icon: null,
    cover: null,
    properties: {
      Name: { id: 'title', name: 'Name', type: 'title', title: {} },
    },
    parent: { type: 'database_id', database_id: '523e4567-e89b-12d3-a456-426614174000' },
    database_parent: { type: 'workspace', workspace: true },
    url: 'https://notion.so/test-data-source',
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
    parent: { type: 'database_id', database_id: '523e4567-e89b-12d3-a456-426614174000' },
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
    it('should retrieve a data source by ID', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      const result = await dataSourcesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        query: undefined,
      });
      expect(result).toBeInstanceOf(DataSource);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should retrieve a data source with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      await dataSourcesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['prop1', 'prop2'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        query: { filter_properties: 'prop1,prop2' },
      });
    });

    it('should throw validation error when filter_properties exceeds limit', async () => {
      const tooManyProperties = new Array(101).fill('prop');

      await expect(
        dataSourcesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
          filter_properties: tooManyProperties,
        }),
      ).rejects.toThrow(NotionValidationError);
    });
  });

  describe('query', () => {
    it('should query a data source without options', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      const result = await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: undefined,
      });
      expect(result.object).toBe('list');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(Page);
      expect(result.type).toBe('page');
    });

    it('should query a data source with filter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      const filter = { property: 'Status', select: { equals: 'Done' } };

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', { filter });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: { filter },
      });
    });

    it('should query a data source with sorts', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      const sorts = [
        { property: 'Name', direction: 'ascending' as const },
        { timestamp: 'created_time' as const, direction: 'descending' as const },
      ];

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', { sorts });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: { sorts },
      });
    });

    it('should query a data source with pagination parameters', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        page_size: 50,
        start_cursor: 'cursor123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          page_size: 50,
          start_cursor: 'cursor123',
        },
      });
    });

    it('should query a data source with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['Name', 'Status'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          filter_properties: ['Name', 'Status'],
        },
      });
    });

    it('should throw validation error when filter_properties exceeds limit', async () => {
      const tooManyProperties = new Array(101).fill('prop');

      await expect(
        dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
          filter_properties: tooManyProperties,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should query a data source with archived filter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        archived: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          archived: true,
        },
      });
    });

    it('should query a data source with in_trash filter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        in_trash: false,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          in_trash: false,
        },
      });
    });

    it('should query a data source with result_type filter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        result_type: 'page',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          result_type: 'page',
        },
      });
    });
  });

  describe('create', () => {
    it('should create a data source', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      const result = await dataSourcesAPI.create({
        parent: { database_id: 'parent-database-id' },
        properties: {
          Name: { title: {} },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources',
        body: {
          parent: { database_id: 'parent-database-id' },
          properties: {
            Name: { title: {} },
          },
        },
      });
      expect(result).toBeInstanceOf(DataSource);
    });

    it('should create a data source with title', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      const title = [{ type: 'text', text: { content: 'My Data Source' } }];

      await dataSourcesAPI.create({
        parent: { database_id: 'parent-database-id' },
        properties: { Name: { title: {} } },
        title,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources',
        body: {
          parent: { database_id: 'parent-database-id' },
          properties: { Name: { title: {} } },
          title,
        },
      });
    });

    it('should throw validation error when title array exceeds limit', async () => {
      const tooManyTitleElements = new Array(101).fill({ type: 'text', text: { content: 'x' } });

      await expect(
        dataSourcesAPI.create({
          parent: { database_id: 'parent-database-id' },
          properties: { Name: { title: {} } },
          title: tooManyTitleElements,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should create a data source with icon', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      await dataSourcesAPI.create({
        parent: { database_id: 'parent-database-id' },
        properties: { Name: { title: {} } },
        icon: { type: 'emoji', emoji: '📊' },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources',
        body: {
          parent: { database_id: 'parent-database-id' },
          properties: { Name: { title: {} } },
          icon: { type: 'emoji', emoji: '📊' },
        },
      });
    });
  });

  describe('update', () => {
    it('should update data source properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      const result = await dataSourcesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        properties: {
          Status: {
            select: {
              options: [{ name: 'Todo' }, { name: 'Done' }],
            },
          },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: {
          properties: {
            Status: {
              select: {
                options: [{ name: 'Todo' }, { name: 'Done' }],
              },
            },
          },
        },
      });
      expect(result).toBeInstanceOf(DataSource);
    });

    it('should update data source title', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      const title = [{ type: 'text', text: { content: 'Updated Data Source' } }];

      await dataSourcesAPI.update('123e4567-e89b-12d3-a456-426614174000', { title });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { title },
      });
    });

    it('should throw validation error when title array exceeds limit', async () => {
      const tooManyTitleElements = new Array(101).fill({ type: 'text', text: { content: 'x' } });

      await expect(
        dataSourcesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
          title: tooManyTitleElements,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should archive a data source', async () => {
      const archivedDataSource = { ...mockDataSourceResponse, archived: true };
      vi.mocked(mockClient.request).mockResolvedValue(archivedDataSource);

      await dataSourcesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        archived: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: true },
      });
    });

    it('should move data source to trash', async () => {
      const trashedDataSource = { ...mockDataSourceResponse, in_trash: true };
      vi.mocked(mockClient.request).mockResolvedValue(trashedDataSource);

      await dataSourcesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        in_trash: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { in_trash: true },
      });
    });

    it('should move data source to different database', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      await dataSourcesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        parent: { database_id: 'new-database-id' },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { parent: { database_id: 'new-database-id' } },
      });
    });
  });

  describe('archive', () => {
    it('should archive a data source using convenience method', async () => {
      const archivedDataSource = { ...mockDataSourceResponse, archived: true };
      vi.mocked(mockClient.request).mockResolvedValue(archivedDataSource);

      const result = await dataSourcesAPI.archive('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: true },
      });
      expect(result).toBeInstanceOf(DataSource);
    });
  });

  describe('restore', () => {
    it('should restore an archived data source using convenience method', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      const result = await dataSourcesAPI.restore('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: false },
      });
      expect(result).toBeInstanceOf(DataSource);
    });
  });

  describe('trash', () => {
    it('should move data source to trash using convenience method', async () => {
      const trashedDataSource = { ...mockDataSourceResponse, in_trash: true };
      vi.mocked(mockClient.request).mockResolvedValue(trashedDataSource);

      const result = await dataSourcesAPI.trash('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { in_trash: true },
      });
      expect(result).toBeInstanceOf(DataSource);
    });
  });

  describe('untrash', () => {
    it('should restore data source from trash using convenience method', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      const result = await dataSourcesAPI.untrash('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        body: { in_trash: false },
      });
      expect(result).toBeInstanceOf(DataSource);
    });
  });
});
