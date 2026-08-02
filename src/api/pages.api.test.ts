import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesAPI } from './pages.api';
import type { NotionClient } from '../client';
import { Page } from '../models';
import { NotionValidationError } from '../validation';

describe('PagesAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const pagesAPI = new PagesAPI(mockClient);

  const mockPageResponse = {
    object: 'page',
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: { object: 'user', id: '323e4567-e89b-12d3-a456-426614174000' },
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retrieve', () => {
    it('should retrieve a page with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['prop1', 'prop2'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        query: { filter_properties: ['prop1', 'prop2'] },
      });
    });

    it('should throw validation error when filter_properties exceeds limit', async () => {
      const tooManyProperties = new Array(101).fill('prop');

      await expect(
        pagesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
          filter_properties: tooManyProperties,
        }),
      ).rejects.toThrow(NotionValidationError);
    });
  });

  describe('create', () => {
    it('should create a page with database parent', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.create({
        parent: { database_id: 'database-id' },
        properties: {
          Name: { title: [{ type: 'text', text: { content: 'New Page' } }] },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages',
        body: {
          parent: { database_id: 'database-id' },
          properties: {
            Name: { title: [{ type: 'text', text: { content: 'New Page' } }] },
          },
        },
      });
    });

    it('should create a page with children', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      const children = [
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: 'Content' } }] },
        },
      ];

      await pagesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: {},
        children,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: {},
          children,
        },
      });
    });

    it('should throw validation error when children array exceeds limit', async () => {
      const children = new Array(101).fill({ type: 'paragraph', paragraph: { rich_text: [] } });

      await expect(
        pagesAPI.create({
          parent: { page_id: 'parent-page-id' },
          properties: {},
          children,
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should create a page with icon and cover', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.create({
        parent: { workspace: true },
        properties: {},
        icon: { type: 'emoji', emoji: '📄' },
        cover: { type: 'external', external: { url: 'https://example.com/cover.jpg' } },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages',
        body: {
          parent: { workspace: true },
          properties: {},
          icon: { type: 'emoji', emoji: '📄' },
          cover: { type: 'external', external: { url: 'https://example.com/cover.jpg' } },
        },
      });
    });

    it('should create a page with template', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: {},
        template: { type: 'template_id', template_id: 'template-123' },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: {},
          template: { type: 'template_id', template_id: 'template-123' },
        },
      });
    });

    it('should create a page with position', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: {},
        position: { type: 'after_block', after_block: { id: 'block-123' } },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: {},
          position: { type: 'after_block', after_block: { id: 'block-123' } },
        },
      });
    });

    it('should create a page from markdown', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.create({
        parent: { page_id: 'parent-page-id' },
        markdown: '# Title\n\nSome content.',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages',
        body: {
          parent: { page_id: 'parent-page-id' },
          markdown: '# Title\n\nSome content.',
        },
      });
    });

    it('should throw validation error when markdown is combined with properties', async () => {
      await expect(
        pagesAPI.create({
          parent: { page_id: 'parent-page-id' },
          properties: {},
          markdown: '# Title',
        }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should throw validation error when markdown is combined with children', async () => {
      await expect(
        pagesAPI.create({
          parent: { page_id: 'parent-page-id' },
          children: [],
          markdown: '# Title',
        }),
      ).rejects.toThrow(NotionValidationError);
    });
  });

  describe('update', () => {
    it('should update page properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      const result = await pagesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        properties: {
          Status: { select: { name: 'In Progress' } },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        body: {
          properties: {
            Status: { select: { name: 'In Progress' } },
          },
        },
      });
      expect(result).toBeInstanceOf(Page);
    });

    it('should update page icon and cover', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        icon: { type: 'emoji', emoji: '🚀' },
        cover: { type: 'external', external: { url: 'https://example.com/new-cover.jpg' } },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        body: {
          icon: { type: 'emoji', emoji: '🚀' },
          cover: { type: 'external', external: { url: 'https://example.com/new-cover.jpg' } },
        },
      });
    });

    it('should update is_locked status', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        is_locked: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        body: { is_locked: true },
      });
    });
  });

  describe('move', () => {
    it('should move a page to a new parent page', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      const result = await pagesAPI.move('123e4567-e89b-12d3-a456-426614174000', {
        type: 'page_id',
        page_id: 'new-parent-page-id',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000/move',
        body: { parent: { type: 'page_id', page_id: 'new-parent-page-id' } },
      });
      expect(result).toBeInstanceOf(Page);
    });

    it('should move a page to a new data source', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.move('123e4567-e89b-12d3-a456-426614174000', {
        type: 'data_source_id',
        data_source_id: 'new-data-source-id',
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000/move',
        body: { parent: { type: 'data_source_id', data_source_id: 'new-data-source-id' } },
      });
    });
  });

  describe('getMarkdown', () => {
    const mockMarkdownResponse = {
      object: 'page_markdown',
      id: '123e4567-e89b-12d3-a456-426614174000',
      markdown: '# Title\n\nContent.',
      truncated: false,
      unknown_block_ids: [],
    };

    it('should retrieve a page as markdown', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockMarkdownResponse);

      const result = await pagesAPI.getMarkdown('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000/markdown',
        query: undefined,
      });
      expect(result.markdown).toBe('# Title\n\nContent.');
    });

    it('should send include_transcript as a query param', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockMarkdownResponse);

      await pagesAPI.getMarkdown('123e4567-e89b-12d3-a456-426614174000', {
        include_transcript: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000/markdown',
        query: { include_transcript: 'true' },
      });
    });
  });

  describe('updateMarkdown', () => {
    const mockMarkdownResponse = {
      object: 'page_markdown',
      id: '123e4567-e89b-12d3-a456-426614174000',
      markdown: 'Updated content.',
      truncated: false,
      unknown_block_ids: [],
    };

    it.each([
      {
        type: 'update_content' as const,
        content_updates: [{ old_str: 'foo', new_str: 'bar' }],
      },
      { type: 'replace_content' as const, new_str: 'Replaced content' },
      {
        type: 'insert_content' as const,
        content: 'Inserted content',
        position: { type: 'end' as const },
      },
      {
        type: 'replace_content_range' as const,
        content: 'Ranged content',
        content_range: { start: 0, end: 10 },
      },
    ])('should serialize a $type markdown update', async (options) => {
      vi.mocked(mockClient.request).mockResolvedValue(mockMarkdownResponse);

      const result = await pagesAPI.updateMarkdown('123e4567-e89b-12d3-a456-426614174000', options);

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000/markdown',
        body: options,
      });
      expect(result.object).toBe('page_markdown');
    });

    it('should parse an async_task response when allow_async is set', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({
        object: 'async_task',
        id: '223e4567-e89b-12d3-a456-426614174000',
        status: 'queued',
        status_url: 'https://api.notion.com/v1/async_tasks/223e4567-e89b-12d3-a456-426614174000',
        created_time: '2026-01-01T00:00:00.000Z',
        operation: { surface: 'rest', name: 'update_page_markdown' },
      });

      const result = await pagesAPI.updateMarkdown('123e4567-e89b-12d3-a456-426614174000', {
        type: 'replace_content',
        new_str: 'Replaced content',
        allow_async: true,
      });

      expect(result.object).toBe('async_task');
    });
  });
});
