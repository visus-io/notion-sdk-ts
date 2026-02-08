import { describe, expect, it } from 'vitest';
import { Block } from '.';

describe('Block', () => {
  it('should create a valid block model', () => {
    const blockData = {
      object: 'block',
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
      type: 'paragraph',
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
      archived: false,
      in_trash: false,
      has_children: false,
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Test paragraph', link: null },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: 'Test paragraph',
            href: null,
          },
        ],
        color: 'default',
      },
    };

    const block = new Block(blockData);
    expect(block.object).toBe('block');
    expect(block.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(block.type).toBe('paragraph');
    expect(block.createdTime).toEqual(new Date('2023-01-01T00:00:00.000Z'));
    expect(block.lastEditedTime).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    expect(block.archived).toBe(false);
    expect(block.inTrash).toBe(false);
    expect(block.hasChildren).toBe(false);
    expect(block.isTextBlock()).toBe(true);
    expect(block.getPlainText()).toBe('Test paragraph');
  });

  it('should identify heading blocks', () => {
    const blockData = {
      object: 'block',
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
      type: 'heading_1',
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
      archived: false,
      in_trash: false,
      has_children: false,
      heading_1: {
        rich_text: [],
        color: 'default',
        is_toggleable: false,
      },
    };

    const block = new Block(blockData);
    expect(block.isHeading()).toBe(true);
    expect(block.canHaveChildren()).toBe(true);
  });

  it('should handle non-text blocks', () => {
    const blockData = {
      object: 'block',
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
      type: 'divider',
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
      archived: false,
      in_trash: false,
      has_children: false,
      divider: {},
    };

    const block = new Block(blockData);
    expect(block.isTextBlock()).toBe(false);
    expect(block.isHeading()).toBe(false);
    expect(block.getPlainText()).toBe(null);
  });
});
