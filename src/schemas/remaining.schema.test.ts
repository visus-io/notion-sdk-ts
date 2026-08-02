import { describe, expect, it } from 'vitest';
import { emojiSchema } from './emoji.schema';
import { fileSchema } from './file.schema';
import { iconSchema } from './icon.schema';
import { parentSchema } from './parent.schema';
import { paginatedListSchema } from './pagination.schema';
import { databaseSchema } from './database.schema';
import { pageSchema } from './page.schema';
import { dataSourceSchema } from './dataSource.schema';

describe('emojiSchema', () => {
  it('should parse valid emoji', () => {
    const emoji = {
      type: 'emoji' as const,
      emoji: '🎉',
    };

    const result = emojiSchema.safeParse(emoji);
    expect(result.success).toBe(true);
  });

  it('should trim emoji whitespace', () => {
    const emoji = {
      type: 'emoji' as const,
      emoji: '  😀  ',
    };

    const result = emojiSchema.safeParse(emoji);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emoji).toBe('😀');
    }
  });
});

describe('fileSchema', () => {
  it('should parse notion-hosted file', () => {
    const file = {
      type: 'file' as const,
      file: {
        url: 'https://s3.amazonaws.com/notion/file.pdf',
        expiry_time: '2024-12-31T23:59:59.999Z',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it('should parse file_upload file', () => {
    const file = {
      type: 'file_upload' as const,
      file_upload: {
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it('should parse external file', () => {
    const file = {
      type: 'external' as const,
      external: {
        url: 'https://example.com/image.png',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const file = {
      type: 'external',
      external: {
        url: 'not-a-url',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });
});

describe('iconSchema', () => {
  it('should parse a native icon with color', () => {
    const icon = {
      type: 'icon' as const,
      icon: { name: 'star circle', color: 'blue' as const },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(true);
  });

  it('should parse a native icon without color', () => {
    const icon = {
      type: 'icon' as const,
      icon: { name: 'token' },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid native icon color', () => {
    const icon = {
      type: 'icon' as const,
      icon: { name: 'token', color: 'not-a-color' },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(false);
  });

  it('should parse a custom emoji icon', () => {
    const icon = {
      type: 'custom_emoji' as const,
      custom_emoji: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'party-parrot',
        url: 'https://example.com/emoji.png',
      },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(true);
  });

  it('should still parse emoji and file icons', () => {
    expect(iconSchema.safeParse({ type: 'emoji', emoji: '🎉' }).success).toBe(true);
    expect(
      iconSchema.safeParse({ type: 'external', external: { url: 'https://example.com/i.png' } })
        .success,
    ).toBe(true);
  });
});

describe('parentSchema', () => {
  it('should parse database parent', () => {
    const parent = {
      type: 'database_id' as const,
      database_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse data_source parent', () => {
    const parent = {
      type: 'data_source_id' as const,
      data_source_id: '123e4567-e89b-12d3-a456-426614174001',
      database_id: '123e4567-e89b-12d3-a456-426614174002',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse page parent', () => {
    const parent = {
      type: 'page_id' as const,
      page_id: '123e4567-e89b-12d3-a456-426614174003',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse workspace parent', () => {
    const parent = {
      type: 'workspace' as const,
      workspace: true as const,
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse block parent', () => {
    const parent = {
      type: 'block_id' as const,
      block_id: '123e4567-e89b-12d3-a456-426614174004',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse agent parent', () => {
    const parent = {
      type: 'agent_id' as const,
      agent_id: '123e4567-e89b-12d3-a456-426614174005',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });
});

describe('paginatedListSchema', () => {
  it('should parse paginated list of pages', () => {
    const schema = paginatedListSchema(
      parentSchema, // Just using a simple schema for testing
    );

    const list = {
      object: 'list' as const,
      results: [
        {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      ],
      next_cursor: 'cursor-123',
      has_more: true,
      type: 'page' as const,
    };

    const result = schema.safeParse(list);
    expect(result.success).toBe(true);
  });

  it('should parse empty paginated list', () => {
    const schema = paginatedListSchema(parentSchema);

    const list = {
      object: 'list' as const,
      results: [],
      next_cursor: null,
      has_more: false,
      type: 'block' as const,
    };

    const result = schema.safeParse(list);
    expect(result.success).toBe(true);
  });
});

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
});

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
