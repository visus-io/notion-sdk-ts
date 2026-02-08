import { describe, expect, it } from 'vitest';
import { DataSource } from '.';
import type { NotionDataSource } from '../schemas';

describe('DataSource', () => {
  it('should create a valid data source model', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {
        Name: {
          id: 'title',
          name: 'Name',
          type: 'title',
          title: {},
        },
        Status: {
          id: 'status',
          name: 'Status',
          type: 'status',
          status: {
            options: [
              { id: '1', name: 'Not started', color: 'default' },
              { id: '2', name: 'In progress', color: 'blue' },
              { id: '3', name: 'Done', color: 'green' },
            ],
            groups: [
              { id: 'g1', name: 'To do', color: 'default', option_ids: ['1'] },
              { id: 'g2', name: 'In progress', color: 'blue', option_ids: ['2'] },
              { id: 'g3', name: 'Complete', color: 'green', option_ids: ['3'] },
            ],
          },
        },
      },
      parent: {
        type: 'database_id',
        database_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'workspace',
        workspace: true,
      },
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
          text: { content: 'My Data Source', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'My Data Source',
          href: null,
        },
      ],
      description: [
        {
          type: 'text',
          text: { content: 'A test data source', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'A test data source',
          href: null,
        },
      ],
      icon: null,
      cover: null,
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.object).toBe('data_source');
    expect(dataSource.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(dataSource.createdTime).toEqual(new Date('2023-01-01T00:00:00.000Z'));
    expect(dataSource.lastEditedTime).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    expect(dataSource.archived).toBe(false);
    expect(dataSource.inTrash).toBe(false);
    expect(dataSource.url).toBe('https://notion.so/datasource');
    expect(dataSource.publicUrl).toBe(null);
    expect(dataSource.isInline).toBe(false);
  });

  it('should extract title and description as plain text', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {},
      parent: {
        type: 'database_id',
        database_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'workspace',
        workspace: true,
      },
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
          text: { content: ' List', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: ' List',
          href: null,
        },
      ],
      description: [
        {
          type: 'text',
          text: { content: 'Track all ', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Track all ',
          href: null,
        },
        {
          type: 'text',
          text: { content: 'project tasks', link: null },
          annotations: {
            bold: true,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'project tasks',
          href: null,
        },
      ],
      icon: null,
      cover: null,
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.getTitle()).toBe('Task List');
    expect(dataSource.getDescription()).toBe('Track all project tasks');
  });

  it('should identify parent database ID', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {},
      parent: {
        type: 'database_id',
        database_id: '523e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'workspace',
        workspace: true,
      },
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
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.getParentDatabaseId()).toBe('523e4567-e89b-12d3-a456-426614174000');
  });

  it('should return undefined for getParentDatabaseId when parent is not database_id', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {},
      parent: {
        type: 'workspace',
        workspace: true,
      },
      database_parent: {
        type: 'workspace',
        workspace: true,
      },
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
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.getParentDatabaseId()).toBeUndefined();
  });

  it('should access properties and use helper methods', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {
        Title: {
          id: 'title',
          name: 'Title',
          type: 'title',
          title: {},
        },
        Status: {
          id: 'status',
          name: 'Status',
          type: 'select',
          select: {
            options: [
              { id: '1', name: 'Active', color: 'green' },
              { id: '2', name: 'Archived', color: 'gray' },
            ],
          },
        },
        Priority: {
          id: 'priority',
          name: 'Priority',
          type: 'number',
          number: { format: 'number' },
        },
      },
      parent: {
        type: 'database_id',
        database_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'workspace',
        workspace: true,
      },
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
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);

    expect(dataSource.properties).toBeDefined();
    expect(dataSource.getPropertyNames()).toEqual(['Title', 'Status', 'Priority']);
    expect(dataSource.hasProperty('Title')).toBe(true);
    expect(dataSource.hasProperty('NonExistent')).toBe(false);

    const titleProp = dataSource.getProperty('Title');
    expect(titleProp).toBeDefined();
    expect(titleProp?.type).toBe('title');

    const statusProp = dataSource.getProperty('Status');
    expect(statusProp).toBeDefined();
    expect(statusProp?.type).toBe('select');
  });

  it('should access metadata fields', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {},
      parent: {
        type: 'database_id',
        database_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'page_id',
        page_id: '423e4567-e89b-12d3-a456-426614174000',
      },
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
      url: 'https://notion.so/datasource-123',
      archived: true,
      in_trash: true,
      is_inline: true,
      public_url: 'https://public.notion.so/datasource',
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.icon).toEqual({ type: 'emoji', emoji: '📊' });
    expect(dataSource.cover).toEqual({
      type: 'external',
      external: { url: 'https://example.com/cover.png' },
    });
    expect(dataSource.archived).toBe(true);
    expect(dataSource.inTrash).toBe(true);
    expect(dataSource.isInline).toBe(true);
    expect(dataSource.publicUrl).toBe('https://public.notion.so/datasource');
    expect(dataSource.createdBy.id).toBe('323e4567-e89b-12d3-a456-426614174000');
    expect(dataSource.lastEditedBy.id).toBe('423e4567-e89b-12d3-a456-426614174000');
  });

  it('should access parent and database parent objects', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {},
      parent: {
        type: 'database_id',
        database_id: '523e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'page_id',
        page_id: '623e4567-e89b-12d3-a456-426614174000',
      },
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
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.parent.type).toBe('database_id');
    if (dataSource.parent.type === 'database_id') {
      expect(dataSource.parent.database_id).toBe('523e4567-e89b-12d3-a456-426614174000');
    }

    expect(dataSource.databaseParent.type).toBe('page_id');
    if (dataSource.databaseParent.type === 'page_id') {
      expect(dataSource.databaseParent.page_id).toBe('623e4567-e89b-12d3-a456-426614174000');
    }
  });

  it('should handle empty title and description', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {},
      parent: {
        type: 'database_id',
        database_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'workspace',
        workspace: true,
      },
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
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.getTitle()).toBe('');
    expect(dataSource.getDescription()).toBe('');
  });

  it('should access title and description getters', () => {
    const dataSourceData: NotionDataSource = {
      object: 'data_source',
      id: '123e4567-e89b-12d3-a456-426614174000',
      properties: {},
      parent: {
        type: 'database_id',
        database_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      database_parent: {
        type: 'workspace',
        workspace: true,
      },
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
          text: { content: 'Test', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Test',
          href: null,
        },
      ],
      description: [
        {
          type: 'text',
          text: { content: 'Description', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: 'Description',
          href: null,
        },
      ],
      icon: null,
      cover: null,
      url: 'https://notion.so/datasource',
      archived: false,
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const dataSource = new DataSource(dataSourceData);
    expect(dataSource.title).toEqual(dataSourceData.title);
    expect(dataSource.description).toEqual(dataSourceData.description);
  });
});
