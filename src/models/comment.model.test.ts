import { describe, expect, it } from 'vitest';
import { Comment } from '.';

describe('Comment', () => {
  it('should create a valid comment model', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [
        {
          type: 'text' as const,
          text: { content: 'This is a comment', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default' as const,
          },
          plain_text: 'This is a comment',
          href: null,
        },
      ],
    };

    const comment = new Comment(commentData);
    expect(comment.object).toBe('comment');
    expect(comment.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(comment.discussionId).toBe('323e4567-e89b-12d3-a456-426614174000');
    expect(comment.createdTime).toEqual(new Date('2023-01-01T00:00:00.000Z'));
    expect(comment.lastEditedTime).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    expect(comment.richText).toHaveLength(1);
    expect(comment.getPlainText()).toBe('This is a comment');
  });

  it('should identify page parents', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
    };

    const comment = new Comment(commentData);
    expect(comment.hasPageParent()).toBe(true);
    expect(comment.hasBlockParent()).toBe(false);
  });

  it('should identify block parents', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'block_id' as const,
        block_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
    };

    const comment = new Comment(commentData);
    expect(comment.hasBlockParent()).toBe(true);
    expect(comment.hasPageParent()).toBe(false);
  });

  it('should handle comments with attachments', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
      attachments: [
        {
          category: 'image' as const,
          file: {
            url: 'https://example.com/image.png',
            expiry_time: '2023-01-03T00:00:00.000Z',
          },
        },
      ],
    };

    const comment = new Comment(commentData);
    expect(comment.hasAttachments()).toBe(true);
    expect(comment.attachments).toHaveLength(1);
    expect(comment.attachments?.[0].category).toBe('image');
  });

  it('should handle comments without attachments', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
    };

    const comment = new Comment(commentData);
    expect(comment.hasAttachments()).toBe(false);
    expect(comment.attachments).toBeUndefined();
  });

  it('should handle custom display names', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
      display_name: {
        type: 'custom' as const,
        resolved_name: 'Custom Name',
      },
    };

    const comment = new Comment(commentData);
    expect(comment.hasCustomDisplayName()).toBe(true);
    expect(comment.getDisplayName()).toBe('Custom Name');
  });

  it('should handle user display names', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
      display_name: {
        type: 'user' as const,
        resolved_name: 'John Doe',
      },
    };

    const comment = new Comment(commentData);
    expect(comment.hasCustomDisplayName()).toBe(false);
    expect(comment.getDisplayName()).toBe('John Doe');
  });

  it('should extract plain text from multiple rich text segments', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [
        {
          type: 'text' as const,
          text: { content: 'Hello ', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default' as const,
          },
          plain_text: 'Hello ',
          href: null,
        },
        {
          type: 'text' as const,
          text: { content: 'World', link: null },
          annotations: {
            bold: true,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default' as const,
          },
          plain_text: 'World',
          href: null,
        },
      ],
    };

    const comment = new Comment(commentData);
    expect(comment.getPlainText()).toBe('Hello World');
  });

  it('should access parent getter', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
    };

    const comment = new Comment(commentData);
    expect(comment.parent).toEqual(commentData.parent);
  });

  it('should access createdBy getter', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
    };

    const comment = new Comment(commentData);
    expect(comment.createdBy).toEqual(commentData.created_by);
  });

  it('should access displayName getter when undefined', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
    };

    const comment = new Comment(commentData);
    expect(comment.displayName).toBeUndefined();
  });

  it('should serialize to JSON', () => {
    const commentData = {
      object: 'comment' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      parent: {
        type: 'page_id' as const,
        page_id: '223e4567-e89b-12d3-a456-426614174000',
      },
      discussion_id: '323e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      created_by: {
        object: 'user' as const,
        id: '423e4567-e89b-12d3-a456-426614174000',
      },
      last_edited_time: '2023-01-02T00:00:00.000Z',
      rich_text: [],
    };

    const comment = new Comment(commentData);
    const json = comment.toJSON();
    expect(json).toEqual(commentData);
  });
});
