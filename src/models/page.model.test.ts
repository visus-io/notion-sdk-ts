import { describe, expect, it } from 'vitest';
import { Page } from '.';

describe('Page', () => {
  it('should create a valid page model', () => {
    const pageData = {
      object: 'page',
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      archived: false,
      in_trash: false,
      icon: null,
      cover: null,
      properties: {
        title: {
          id: 'title',
          type: 'title',
          title: [
            {
              type: 'text',
              text: { content: 'My Page', link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              plain_text: 'My Page',
              href: null,
            },
          ],
        },
      },
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/page',
      public_url: null,
    };

    const page = new Page(pageData);
    expect(page.object).toBe('page');
    expect(page.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(page.createdTime).toEqual(new Date('2023-01-01T00:00:00.000Z'));
    expect(page.lastEditedTime).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    expect(page.archived).toBe(false);
    expect(page.inTrash).toBe(false);
    expect(page.url).toBe('https://notion.so/page');
    expect(page.publicUrl).toBe(null);
    expect(page.getTitle()).toBe('My Page');
  });

  it('should identify database pages', () => {
    const pageData = {
      object: 'page',
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      archived: false,
      in_trash: false,
      icon: null,
      cover: null,
      properties: {},
      parent: {
        type: 'database_id',
        database_id: '323e4567-e89b-12d3-a456-426614174000',
      },
      url: 'https://notion.so/page',
      public_url: null,
    };

    const page = new Page(pageData);
    expect(page.isInDatabase()).toBe(true);
    expect(page.isSubpage()).toBe(false);
  });

  it('should identify subpages', () => {
    const pageData = {
      object: 'page',
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      archived: false,
      in_trash: false,
      icon: null,
      cover: null,
      properties: {},
      parent: {
        type: 'page_id',
        page_id: '423e4567-e89b-12d3-a456-426614174000',
      },
      url: 'https://notion.so/page',
      public_url: null,
    };

    const page = new Page(pageData);
    expect(page.isSubpage()).toBe(true);
    expect(page.isInDatabase()).toBe(false);
  });

  it('should get property by name', () => {
    const pageData = {
      object: 'page',
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      archived: false,
      in_trash: false,
      icon: null,
      cover: null,
      properties: {
        status: {
          id: 'status',
          type: 'status',
          status: {
            id: '1',
            name: 'In Progress',
            color: 'blue',
          },
        },
      },
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/page',
      public_url: null,
    };

    const page = new Page(pageData);
    const statusProp = page.getProperty('status');
    expect(statusProp).toBeDefined();
    expect(statusProp?.type).toBe('status');

    const missingProp = page.getProperty('nonexistent');
    expect(missingProp).toBeUndefined();
  });

  it('should return properties record', () => {
    const pageData = {
      object: 'page',
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      archived: false,
      in_trash: false,
      icon: null,
      cover: null,
      properties: {
        title: {
          id: 'title',
          type: 'title',
          title: [],
        },
      },
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/page',
      public_url: null,
    };

    const page = new Page(pageData);
    const props = page.properties;
    expect(Object.keys(props)).toContain('title');
  });

  it('should return null when no title property exists', () => {
    const pageData = {
      object: 'page',
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      last_edited_by: {
        object: 'user',
        id: '223e4567-e89b-12d3-a456-426614174000',
      },
      archived: false,
      in_trash: false,
      icon: null,
      cover: null,
      properties: {
        status: {
          id: 'status',
          type: 'status',
          status: {
            id: '1',
            name: 'Active',
            color: 'green',
          },
        },
      },
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/page',
      public_url: null,
    };

    const page = new Page(pageData);
    expect(page.getTitle()).toBeNull();
  });
});
