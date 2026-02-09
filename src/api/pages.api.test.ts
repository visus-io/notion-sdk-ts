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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retrieve', () => {
    it('should retrieve a page by ID', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      const result = await pagesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        query: undefined,
      });
      expect(result).toBeInstanceOf(Page);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should retrieve a page with filter_properties', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      await pagesAPI.retrieve('123e4567-e89b-12d3-a456-426614174000', {
        filter_properties: ['prop1', 'prop2'],
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        query: { filter_properties: 'prop1,prop2' },
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
    it('should create a page with page parent', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      const result = await pagesAPI.create({
        parent: { page_id: 'parent-page-id' },
        properties: {
          title: { title: [{ type: 'text', text: { content: 'New Page' } }] },
        },
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/pages',
        body: {
          parent: { page_id: 'parent-page-id' },
          properties: {
            title: { title: [{ type: 'text', text: { content: 'New Page' } }] },
          },
        },
      });
      expect(result).toBeInstanceOf(Page);
    });

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

    it('should archive a page', async () => {
      const archivedPage = { ...mockPageResponse, archived: true };
      vi.mocked(mockClient.request).mockResolvedValue(archivedPage);

      const result = await pagesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        archived: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: true },
      });
      expect(result.archived).toBe(true);
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

    it('should move page to trash', async () => {
      const trashedPage = { ...mockPageResponse, in_trash: true };
      vi.mocked(mockClient.request).mockResolvedValue(trashedPage);

      await pagesAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        in_trash: true,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        body: { in_trash: true },
      });
    });
  });

  describe('archive', () => {
    it('should archive a page using convenience method', async () => {
      const archivedPage = { ...mockPageResponse, archived: true };
      vi.mocked(mockClient.request).mockResolvedValue(archivedPage);

      const result = await pagesAPI.archive('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: true },
      });
      expect(result).toBeInstanceOf(Page);
      expect(result.archived).toBe(true);
    });
  });

  describe('restore', () => {
    it('should restore an archived page using convenience method', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockPageResponse);

      const result = await pagesAPI.restore('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/pages/123e4567-e89b-12d3-a456-426614174000',
        body: { archived: false },
      });
      expect(result).toBeInstanceOf(Page);
      expect(result.archived).toBe(false);
    });
  });
});
