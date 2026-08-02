import { describe, expect, it } from 'vitest';
import { pageSchema } from './page.schema';

describe('pageSchema', () => {
  const baseUser = {
    object: 'user' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
  };

  it('should parse page with minimal properties', () => {
    const page = {
      object: 'page' as const,
      id: '123e4567-e89b-12d3-a456-426614174001',
      created_time: '2024-01-01T00:00:00.000Z',
      created_by: baseUser,
      last_edited_time: '2024-01-02T00:00:00.000Z',
      last_edited_by: baseUser,
      in_trash: false,
      icon: null,
      cover: null,
      properties: {},
      parent: {
        type: 'workspace' as const,
        workspace: true as const,
      },
      url: 'https://notion.so/page',
      public_url: null,
    };

    const result = pageSchema.safeParse(page);
    expect(result.success).toBe(true);
  });

  it('should parse page with properties and icon', () => {
    const page = {
      object: 'page' as const,
      id: '123e4567-e89b-12d3-a456-426614174002',
      created_time: '2024-01-01T00:00:00.000Z',
      created_by: baseUser,
      last_edited_time: '2024-01-02T00:00:00.000Z',
      last_edited_by: baseUser,
      in_trash: false,
      icon: {
        type: 'emoji' as const,
        emoji: '📄',
      },
      cover: {
        type: 'external' as const,
        external: {
          url: 'https://example.com/cover.jpg',
        },
      },
      properties: {
        Title: {
          id: 'title',
          type: 'title' as const,
          title: [],
        },
      },
      parent: {
        type: 'database_id' as const,
        database_id: '123e4567-e89b-12d3-a456-426614174003',
      },
      url: 'https://notion.so/page',
      public_url: 'https://notion.so/public-page',
    };

    const result = pageSchema.safeParse(page);
    expect(result.success).toBe(true);
  });
});
