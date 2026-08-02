import { describe, expect, it } from 'vitest';
import { dataSourceSchema } from './dataSource.schema';

describe('dataSourceSchema', () => {
  const baseUser = {
    object: 'user' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
  };

  it('should parse data source with minimal fields', () => {
    const dataSource = {
      object: 'data_source' as const,
      id: '123e4567-e89b-12d3-a456-426614174001',
      properties: {},
      parent: {
        type: 'database_id' as const,
        database_id: '123e4567-e89b-12d3-a456-426614174002',
      },
      database_parent: {
        type: 'workspace' as const,
        workspace: true as const,
      },
      created_time: '2024-01-01T00:00:00.000Z',
      created_by: baseUser,
      last_edited_time: '2024-01-02T00:00:00.000Z',
      last_edited_by: baseUser,
      title: [],
      description: [],
      icon: null,
      cover: null,
      url: 'https://notion.so/datasource',
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const result = dataSourceSchema.safeParse(dataSource);
    expect(result.success).toBe(true);
  });

  it('should parse data source with properties', () => {
    const dataSource = {
      object: 'data_source' as const,
      id: '123e4567-e89b-12d3-a456-426614174003',
      properties: {
        Name: {
          type: 'title' as const,
          id: 'title',
          name: 'Name',
          title: {},
        },
        Status: {
          type: 'select' as const,
          id: 'status',
          name: 'Status',
          select: {
            options: [{ id: 'opt-1', name: 'Active', color: 'green' as const }],
          },
        },
      },
      parent: {
        type: 'database_id' as const,
        database_id: '123e4567-e89b-12d3-a456-426614174004',
      },
      database_parent: {
        type: 'page_id' as const,
        page_id: '123e4567-e89b-12d3-a456-426614174005',
      },
      created_time: '2024-01-01T00:00:00.000Z',
      created_by: baseUser,
      last_edited_time: '2024-01-02T00:00:00.000Z',
      last_edited_by: baseUser,
      title: [],
      description: [],
      icon: {
        type: 'emoji' as const,
        emoji: '🗂️',
      },
      cover: null,
      url: 'https://notion.so/datasource',
      in_trash: false,
      is_inline: true,
      public_url: 'https://notion.so/public-ds',
    };

    const result = dataSourceSchema.safeParse(dataSource);
    expect(result.success).toBe(true);
  });
});
