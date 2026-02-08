import { describe, expect, it } from 'vitest';
import { Database } from '.';
import type { NotionDatabase } from '../schemas';

describe('Database', () => {
  it('should create a valid database model', () => {
    const databaseData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Main data source',
        },
      ],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      title: [
        {
          type: 'text',
          text: { content: 'My Database', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'My Database',
          href: null,
        },
      ],
      description: [
        {
          type: 'text',
          text: { content: 'A test database', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'A test database',
          href: null,
        },
      ],
      icon: null,
      cover: null,
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/database',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const database = new Database(databaseData);
    expect(database.object).toBe('database');
    expect(database.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(database.createdTime).toEqual(new Date('2023-01-01T00:00:00.000Z'));
    expect(database.lastEditedTime).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    expect(database.archived).toBe(false);
    expect(database.inTrash).toBe(false);
    expect(database.url).toBe('https://notion.so/database');
    expect(database.publicUrl).toBe(null);
    expect(database.isInline).toBe(false);
  });

  it('should extract title and description as plain text', () => {
    const databaseData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      title: [
        {
          type: 'text',
          text: { content: 'Task', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Task',
          href: null,
        },
        {
          type: 'text',
          text: { content: ' Database', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: ' Database',
          href: null,
        },
      ],
      description: [
        {
          type: 'text',
          text: { content: 'Track project tasks', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Track project tasks',
          href: null,
        },
      ],
      icon: null,
      cover: null,
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/database',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const database = new Database(databaseData);
    expect(database.getTitle()).toBe('Task Database');
    expect(database.getDescription()).toBe('Track project tasks');
  });

  it('should identify full page vs inline databases', () => {
    const fullPageData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      title: [],
      description: [],
      icon: null,
      cover: null,
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/database',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const database = new Database(fullPageData);
    expect(database.isFullPage()).toBe(true);
    expect(database.isInline).toBe(false);

    const inlineData: NotionDatabase = { ...fullPageData, is_inline: true };
    const inlineDatabase = new Database(inlineData);
    expect(inlineDatabase.isFullPage()).toBe(false);
    expect(inlineDatabase.isInline).toBe(true);
  });

  it('should identify parent type - page parent', () => {
    const databaseData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      title: [],
      description: [],
      icon: null,
      cover: null,
      parent: {
        type: 'page_id',
        page_id: '423e4567-e89b-12d3-a456-426614174000',
      },
      url: 'https://notion.so/database',
      archived: false,
      in_trash: false,
      is_inline: true,
      public_url: null,
    };

    const database = new Database(databaseData);
    expect(database.hasPageParent()).toBe(true);
    expect(database.hasWorkspaceParent()).toBe(false);
  });

  it('should identify parent type - workspace parent', () => {
    const databaseData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      title: [],
      description: [],
      icon: null,
      cover: null,
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/database',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const database = new Database(databaseData);
    expect(database.hasWorkspaceParent()).toBe(true);
    expect(database.hasPageParent()).toBe(false);
  });

  it('should access data sources array', () => {
    const databaseData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Data Source 1',
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174000',
          name: 'Data Source 2',
        },
      ],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      title: [],
      description: [],
      icon: null,
      cover: null,
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/database',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const database = new Database(databaseData);
    expect(database.dataSources).toHaveLength(2);
    expect(database.dataSources[0].id).toBe('223e4567-e89b-12d3-a456-426614174000');
    expect(database.dataSources[0].name).toBe('Data Source 1');
    expect(database.dataSources[1].name).toBe('Data Source 2');
  });

  it('should access metadata fields', () => {
    const databaseData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      title: [],
      description: [],
      icon: {
        type: 'emoji',
        emoji: '📊',
      },
      cover: {
        type: 'external',
        external: { url: 'https://example.com/cover.png' },
      },
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/database-123',
      archived: true,
      in_trash: false,
      is_inline: false,
      public_url: 'https://public.notion.so/database',
    };

    const database = new Database(databaseData);
    expect(database.icon).toEqual({ type: 'emoji', emoji: '📊' });
    expect(database.cover).toEqual({
      type: 'external',
      external: { url: 'https://example.com/cover.png' },
    });
    expect(database.archived).toBe(true);
    expect(database.publicUrl).toBe('https://public.notion.so/database');
    expect(database.createdBy.id).toBe('323e4567-e89b-12d3-a456-426614174000');
    expect(database.lastEditedBy.id).toBe('423e4567-e89b-12d3-a456-426614174000');
  });

  it('should access title, description, and parent getters', () => {
    const databaseData: NotionDatabase = {
      object: 'database',
      id: '123e4567-e89b-12d3-a456-426614174000',
      data_sources: [],
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '323e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      title: [
        {
          type: 'text',
          text: { content: 'Test Title', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Test Title',
          href: null,
        },
      ],
      description: [
        {
          type: 'text',
          text: { content: 'Test Description', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Test Description',
          href: null,
        },
      ],
      icon: null,
      cover: null,
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/database',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const database = new Database(databaseData);
    expect(database.title).toEqual(databaseData.title);
    expect(database.description).toEqual(databaseData.description);
    expect(database.parent).toEqual(databaseData.parent);
  });
});
