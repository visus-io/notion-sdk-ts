import { describe, expect, it } from 'vitest';
import { blockSchema } from './block.schema';
import type { NotionBlock } from './block.schema';

describe('blockSchema', () => {
  const baseBlock = {
    object: 'block' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
    parent: {
      type: 'page_id' as const,
      page_id: '123e4567-e89b-12d3-a456-426614174001',
    },
    created_time: '2024-01-01T00:00:00.000Z',
    created_by: {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174002',
    },
    last_edited_time: '2024-01-02T00:00:00.000Z',
    last_edited_by: {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174003',
    },
    in_trash: false,
    has_children: false,
  };

  const richTextArray = [
    {
      type: 'text' as const,
      text: { content: 'Hello', link: null },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default' as const,
      },
      plain_text: 'Hello',
      href: null,
    },
  ];

  const externalFile = {
    type: 'external' as const,
    external: { url: 'https://example.com/file.pdf' },
  };

  describe('base block properties', () => {
    it('should parse a valid paragraph block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'paragraph',
        paragraph: {
          rich_text: richTextArray,
          color: 'default',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should reject invalid object literal', () => {
      const block = {
        ...baseBlock,
        object: 'not-block',
        type: 'paragraph',
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const block = {
        ...baseBlock,
        id: 'not-a-uuid',
        type: 'paragraph',
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format', () => {
      const block = {
        ...baseBlock,
        type: 'paragraph',
        created_time: 'not-a-datetime',
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });
  });

  describe('heading blocks', () => {
    it('should parse heading_1 block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'heading_1',
        heading_1: {
          rich_text: richTextArray,
          color: 'blue',
          is_toggleable: false,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse heading_2 block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'heading_2',
        heading_2: {
          rich_text: richTextArray,
          color: 'red',
          is_toggleable: true,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse heading_3 block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'heading_3',
        heading_3: {
          rich_text: richTextArray,
          color: 'green',
          is_toggleable: false,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse heading_4 block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'heading_4',
        heading_4: {
          rich_text: richTextArray,
          color: 'yellow',
          is_toggleable: false,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse toggleable heading_1 with children', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'heading_1',
        has_children: true,
        heading_1: {
          rich_text: richTextArray,
          color: 'default',
          is_toggleable: true,
          children: [
            {
              ...baseBlock,
              id: '123e4567-e89b-12d3-a456-426614174010',
              type: 'paragraph',
              paragraph: {
                rich_text: richTextArray,
                color: 'default',
              },
            },
          ],
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse toggleable heading_2 with children', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'heading_2',
        has_children: true,
        heading_2: {
          rich_text: richTextArray,
          color: 'blue',
          is_toggleable: true,
          children: [
            {
              ...baseBlock,
              id: '123e4567-e89b-12d3-a456-426614174011',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: richTextArray,
                color: 'default',
              },
            },
          ],
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse toggleable heading_3 with nested children', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'heading_3',
        has_children: true,
        heading_3: {
          rich_text: richTextArray,
          color: 'purple',
          is_toggleable: true,
          children: [
            {
              ...baseBlock,
              id: '123e4567-e89b-12d3-a456-426614174012',
              type: 'paragraph',
              has_children: true,
              paragraph: {
                rich_text: richTextArray,
                color: 'default',
                children: [
                  {
                    ...baseBlock,
                    id: '123e4567-e89b-12d3-a456-426614174013',
                    type: 'paragraph',
                    paragraph: {
                      rich_text: richTextArray,
                      color: 'default',
                    },
                  },
                ],
              },
            },
          ],
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('list blocks', () => {
    it('should parse bulleted_list_item block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: richTextArray,
          color: 'default',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse numbered_list_item block with options', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: richTextArray,
          color: 'default',
          list_start_index: 5,
          list_format: 'roman',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse to_do block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'to_do',
        to_do: {
          rich_text: richTextArray,
          checked: true,
          color: 'green',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('media blocks', () => {
    it('should parse image block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'image',
        image: externalFile,
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse video block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'video',
        video: externalFile,
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse audio block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'audio',
        audio: externalFile,
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse pdf block with caption', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'pdf',
        pdf: {
          caption: richTextArray,
          type: 'external',
          external: externalFile,
          name: 'document.pdf',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse file block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'file',
        file: {
          caption: richTextArray,
          type: 'file_upload',
          file_upload: externalFile,
          name: 'data.csv',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('content blocks', () => {
    it('should parse paragraph block with children', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'paragraph',
        has_children: true,
        paragraph: {
          rich_text: richTextArray,
          color: 'yellow',
          children: [
            {
              ...baseBlock,
              id: '123e4567-e89b-12d3-a456-426614174010',
              type: 'paragraph',
              paragraph: {
                rich_text: richTextArray,
                color: 'default',
              },
            },
          ],
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse callout block with emoji icon', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'callout',
        callout: {
          rich_text: richTextArray,
          icon: { type: 'emoji', emoji: '📝' },
          color: 'gray_background',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse callout block with file icon', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'callout',
        callout: {
          rich_text: richTextArray,
          icon: externalFile,
          color: 'blue_background',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse quote block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'quote',
        quote: {
          rich_text: richTextArray,
          color: 'default',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse toggle block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'toggle',
        toggle: {
          rich_text: richTextArray,
          color: 'default',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('code blocks', () => {
    it('should parse code block with valid language', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'code',
        code: {
          caption: [],
          rich_text: richTextArray,
          language: 'typescript',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse code block with python language', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'code',
        code: {
          caption: richTextArray,
          rich_text: richTextArray,
          language: 'python',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('special blocks', () => {
    it('should parse bookmark block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'bookmark',
        bookmark: {
          caption: richTextArray,
          url: 'https://example.com',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should reject bookmark with invalid URL', () => {
      const block = {
        ...baseBlock,
        type: 'bookmark',
        bookmark: {
          caption: richTextArray,
          url: 'not-a-url',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });

    it('should parse embed block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'embed',
        embed: {
          url: 'https://youtube.com/watch?v=123',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse link_preview block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'link_preview',
        link_preview: {
          url: 'https://github.com',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse equation block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'equation',
        equation: {
          expression: 'E = mc^2',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse breadcrumb block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'breadcrumb',
        breadcrumb: {},
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse divider block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'divider',
        divider: {},
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse unsupported block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'unsupported',
        unsupported: {},
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('database and page blocks', () => {
    it('should parse child_database block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'child_database',
        child_database: {
          title: 'My Database',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse child_page block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'child_page',
        child_page: {
          title: 'My Page',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('synced blocks', () => {
    it('should parse synced_block with synced_from', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'synced_block',
        synced_block: {
          synced_from: {
            type: 'block_id',
            block_id: '123e4567-e89b-12d3-a456-426614174020',
          },
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse synced_block with null synced_from (original block)', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'synced_block',
        synced_block: {
          synced_from: null,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('table blocks', () => {
    it('should parse table block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'table',
        table: {
          table_width: 3,
          has_column_header: true,
          has_row_header: false,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse table_row block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'table_row',
        table_row: {
          cells: [richTextArray, richTextArray, richTextArray],
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse table_of_contents block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'table_of_contents',
        table_of_contents: {
          color: 'gray',
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });

  describe('column blocks', () => {
    it('should parse column_list block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'column_list',
        column_list: {},
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse column block with width_ratio', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'column',
        column: {
          width_ratio: 0.5,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should reject column with invalid width_ratio (> 1)', () => {
      const block = {
        ...baseBlock,
        type: 'column',
        column: {
          width_ratio: 1.5,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });

    it('should reject column with invalid width_ratio (< 0)', () => {
      const block = {
        ...baseBlock,
        type: 'column',
        column: {
          width_ratio: -0.1,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });
  });

  describe('template and meeting_notes blocks', () => {
    it('should parse template block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'template',
        template: {
          rich_text: richTextArray,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should parse meeting_notes block', () => {
      const block: NotionBlock = {
        ...baseBlock,
        type: 'meeting_notes',
        meeting_notes: {
          rich_text: richTextArray,
        },
      };

      const result = blockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });
  });
});
