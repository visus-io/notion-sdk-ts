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
    it('should retrieve a data source with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockDataSourceResponse);

      await dataSourcesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['prop1', 'prop2'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000',
        query: { filter_properties: ['prop1', 'prop2'] },
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

  describe('listTemplates', () => {
    const mockTemplateListResponse = {
      templates: [
        { id: '623e4567-e89b-12d3-a456-426614174000', name: 'Weekly Report', is_default: true },
      ],
      has_more: false,
      next_cursor: null,
    };

    it('should list templates with default options', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockTemplateListResponse);

      const result = await dataSourcesAPI.listTemplates('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/templates',
        query: undefined,
      });
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('Weekly Report');
      expect(result.has_more).toBe(false);
      expect(result.next_cursor).toBeNull();
    });

    it('should list templates with name filter and pagination', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockTemplateListResponse);

      await dataSourcesAPI.listTemplates('123e4567-e89b-12d3-a456-426614174000', {
        name: 'Weekly',
        page_size: 10,
        start_cursor: 'cursor123',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/templates',
        query: { name: 'Weekly', page_size: '10', start_cursor: 'cursor123' },
      });
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
        query: { filter_properties: ['Name', 'Status'] },
        body: undefined,
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

    it('should query a data source with is_archived filter', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);

      await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
        is_archived: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
        body: {
          is_archived: true,
        },
      });
    });

    it('should query a data source with the deprecated in_trash filter aliased to is_archived', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
          in_trash: true,
        });

        expect(mockClient.request).toHaveBeenCalledWith({
          method: 'POST',
          path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
          body: {
            is_archived: true,
          },
        });
        expect(warnSpy).toHaveBeenCalledWith(
          '[notion-sdk-ts] QueryDataSourceOptions.in_trash is deprecated, use is_archived instead.',
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('should prefer is_archived over in_trash and not warn when both are provided', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPaginatedPageResponse);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await dataSourcesAPI.query('123e4567-e89b-12d3-a456-426614174000', {
          is_archived: false,
          in_trash: true,
        });

        expect(mockClient.request).toHaveBeenCalledWith({
          method: 'POST',
          path: '/data_sources/123e4567-e89b-12d3-a456-426614174000/query',
          body: {
            is_archived: false,
          },
        });
        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        warnSpy.mockRestore();
      }
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
});
