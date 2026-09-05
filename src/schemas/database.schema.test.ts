import { describe, expect, it } from 'vitest';
import { databaseSchema } from './database.schema';

describe('databaseSchema', () => {
  const baseUser = {
    object: 'user' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
  };

  it('should parse database with minimal fields', () => {
    const database = {
      object: 'database' as const,
      id: '123e4567-e89b-12d3-a456-426614174001',
      data_sources: [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Main Table',
        },
      ],
      created_time: '2024-01-01T00:00:00.000Z',
      created_by: baseUser,
      last_edited_time: '2024-01-02T00:00:00.000Z',
      last_edited_by: baseUser,
      title: [],
      description: [],
      icon: null,
      cover: null,
      parent: {
        type: 'workspace' as const,
        workspace: true as const,
      },
      url: 'https://notion.so/database',
      in_trash: false,
      is_inline: false,
      public_url: null,
    };

    const result = databaseSchema.safeParse(database);
    expect(result.success).toBe(true);
  });

  it('should parse database with emoji icon', () => {
    const database = {
      object: 'database' as const,
      id: '123e4567-e89b-12d3-a456-426614174003',
      data_sources: [],
      created_time: '2024-01-01T00:00:00.000Z',
      created_by: baseUser,
      last_edited_time: '2024-01-02T00:00:00.000Z',
      last_edited_by: baseUser,
      title: [],
      description: [],
      icon: {
        type: 'emoji' as const,
        emoji: '📊',
      },
      cover: null,
      parent: {
        type: 'page_id' as const,
        page_id: '123e4567-e89b-12d3-a456-426614174004',
      },
      url: 'https://notion.so/database',
      in_trash: false,
      is_inline: true,
      public_url: 'https://notion.so/public-db',
    };

    const result = databaseSchema.safeParse(database);
    expect(result.success).toBe(true);
  });

  it('should parse database with a canonical database_type', () => {
    const database = {
      object: 'database' as const,
      id: '123e4567-e89b-12d3-a456-426614174005',
      data_sources: [],
      created_time: '2024-01-01T00:00:00.000Z',
      created_by: baseUser,
      last_edited_time: '2024-01-02T00:00:00.000Z',
      last_edited_by: baseUser,
      title: [],
      description: [],
      icon: null,
      cover: null,
      parent: {
        type: 'workspace' as const,
        workspace: true as const,
      },
      url: 'https://notion.so/database',
      in_trash: false,
      is_inline: false,
      public_url: null,
      database_type: 'tasks' as const,
    };

    const result = databaseSchema.safeParse(database);
    expect(result.success).toBe(true);
  });
});
