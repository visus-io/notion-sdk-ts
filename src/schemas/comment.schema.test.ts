import { describe, expect, it } from 'vitest';
import { commentSchema, commentAttachmentSchema, commentDisplayNameSchema } from './comment.schema';

describe('commentSchema', () => {
  const baseUser = {
    object: 'user' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
  };

  const richTextArray = [
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
  ];

  describe('basic comment', () => {
    it('should parse comment with minimal fields', () => {
      const comment = {
        object: 'comment' as const,
        id: '123e4567-e89b-12d3-a456-426614174001',
        parent: {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174002',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174003',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });

    it('should parse comment with empty rich_text', () => {
      const comment = {
        object: 'comment' as const,
        id: '123e4567-e89b-12d3-a456-426614174004',
        parent: {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174005',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174006',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: [],
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });
  });

  describe('comment with attachments', () => {
    it('should parse comment with image attachment', () => {
      const comment = {
        object: 'comment' as const,
        id: '123e4567-e89b-12d3-a456-426614174007',
        parent: {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174008',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174009',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
        attachments: [
          {
            category: 'image' as const,
            file: {
              url: 'https://example.com/image.png',
              expiry_time: '2024-12-31T23:59:59.999Z',
            },
          },
        ],
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });

    it('should parse comment with multiple attachments', () => {
      const comment = {
        object: 'comment' as const,
        id: '123e4567-e89b-12d3-a456-426614174010',
        parent: {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174011',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174012',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
        attachments: [
          {
            category: 'image' as const,
            file: {
              url: 'https://example.com/image.png',
              expiry_time: '2024-12-31T23:59:59.999Z',
            },
          },
          {
            category: 'pdf' as const,
            file: {
              url: 'https://example.com/document.pdf',
              expiry_time: '2024-12-31T23:59:59.999Z',
            },
          },
          {
            category: 'video' as const,
            file: {
              url: 'https://example.com/video.mp4',
              expiry_time: '2024-12-31T23:59:59.999Z',
            },
          },
        ],
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });

    it('should parse comment with all attachment categories', () => {
      const categories = ['image', 'video', 'file', 'audio', 'pdf'] as const;

      categories.forEach((category) => {
        const comment = {
          object: 'comment' as const,
          id: '123e4567-e89b-12d3-a456-426614174013',
          parent: {
            type: 'page_id' as const,
            page_id: '123e4567-e89b-12d3-a456-426614174014',
          },
          discussion_id: '123e4567-e89b-12d3-a456-426614174015',
          created_time: '2024-01-01T00:00:00.000Z',
          created_by: baseUser,
          last_edited_time: '2024-01-02T00:00:00.000Z',
          rich_text: richTextArray,
          attachments: [
            {
              category,
              file: {
                url: 'https://example.com/file',
                expiry_time: '2024-12-31T23:59:59.999Z',
              },
            },
          ],
        };

        const result = commentSchema.safeParse(comment);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('comment with display_name', () => {
    it('should parse comment with user display_name', () => {
      const comment = {
        object: 'comment' as const,
        id: '123e4567-e89b-12d3-a456-426614174016',
        parent: {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174017',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174018',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
        display_name: {
          type: 'user' as const,
          resolved_name: 'John Doe',
        },
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });

    it('should parse comment with custom display_name', () => {
      const comment = {
        object: 'comment' as const,
        id: '123e4567-e89b-12d3-a456-426614174019',
        parent: {
          type: 'page_id' as const,
          page_id: '123e4567-e89b-12d3-a456-426614174020',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174021',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
        display_name: {
          type: 'custom' as const,
          resolved_name: 'Anonymous User',
        },
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });
  });

  describe('comment with different parent types', () => {
    it('should parse comment with block parent', () => {
      const comment = {
        object: 'comment' as const,
        id: '123e4567-e89b-12d3-a456-426614174022',
        parent: {
          type: 'block_id' as const,
          block_id: '123e4567-e89b-12d3-a456-426614174023',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174024',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });
  });

  describe('validation', () => {
    it('should reject invalid object literal', () => {
      const comment = {
        object: 'not-comment',
        id: '123e4567-e89b-12d3-a456-426614174025',
        parent: {
          type: 'page_id',
          page_id: '123e4567-e89b-12d3-a456-426614174026',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174027',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const comment = {
        object: 'comment',
        id: 'not-a-uuid',
        parent: {
          type: 'page_id',
          page_id: '123e4567-e89b-12d3-a456-426614174028',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174029',
        created_time: '2024-01-01T00:00:00.000Z',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime', () => {
      const comment = {
        object: 'comment',
        id: '123e4567-e89b-12d3-a456-426614174030',
        parent: {
          type: 'page_id',
          page_id: '123e4567-e89b-12d3-a456-426614174031',
        },
        discussion_id: '123e4567-e89b-12d3-a456-426614174032',
        created_time: 'not-a-datetime',
        created_by: baseUser,
        last_edited_time: '2024-01-02T00:00:00.000Z',
        rich_text: richTextArray,
      };

      const result = commentSchema.safeParse(comment);
      expect(result.success).toBe(false);
    });
  });
});

describe('commentAttachmentSchema', () => {
  it('should parse valid attachment', () => {
    const attachment = {
      category: 'image' as const,
      file: {
        url: 'https://example.com/image.png',
        expiry_time: '2024-12-31T23:59:59.999Z',
      },
    };

    const result = commentAttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const attachment = {
      category: 'image',
      file: {
        url: 'not-a-url',
        expiry_time: '2024-12-31T23:59:59.999Z',
      },
    };

    const result = commentAttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(false);
  });

  it('should reject invalid category', () => {
    const attachment = {
      category: 'invalid',
      file: {
        url: 'https://example.com/file',
        expiry_time: '2024-12-31T23:59:59.999Z',
      },
    };

    const result = commentAttachmentSchema.safeParse(attachment);
    expect(result.success).toBe(false);
  });
});

describe('commentDisplayNameSchema', () => {
  it('should parse user display name', () => {
    const displayName = {
      type: 'user' as const,
      resolved_name: 'John Doe',
    };

    const result = commentDisplayNameSchema.safeParse(displayName);
    expect(result.success).toBe(true);
  });

  it('should parse custom display name', () => {
    const displayName = {
      type: 'custom' as const,
      resolved_name: 'Anonymous',
    };

    const result = commentDisplayNameSchema.safeParse(displayName);
    expect(result.success).toBe(true);
  });

  it('should trim resolved_name', () => {
    const displayName = {
      type: 'user' as const,
      resolved_name: '  John Doe  ',
    };

    const result = commentDisplayNameSchema.safeParse(displayName);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resolved_name).toBe('John Doe');
    }
  });

  it('should reject invalid type', () => {
    const displayName = {
      type: 'invalid',
      resolved_name: 'Name',
    };

    const result = commentDisplayNameSchema.safeParse(displayName);
    expect(result.success).toBe(false);
  });
});
