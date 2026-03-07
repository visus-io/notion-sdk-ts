import { describe, expect, it } from 'vitest';
import { richTextSchema } from './richText.schema';

describe('richTextSchema', () => {
  const baseAnnotations = {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: 'default' as const,
  };

  describe('text rich text type', () => {
    it('should parse simple text without link', () => {
      const richText = [
        {
          type: 'text' as const,
          text: { content: 'Hello World', link: null },
          annotations: baseAnnotations,
          plain_text: 'Hello World',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse text with link', () => {
      const richText = [
        {
          type: 'text' as const,
          text: { content: 'Click here', link: { url: 'https://example.com' } },
          annotations: baseAnnotations,
          plain_text: 'Click here',
          href: 'https://example.com',
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse text with annotations', () => {
      const richText = [
        {
          type: 'text' as const,
          text: { content: 'Bold text', link: null },
          annotations: {
            bold: true,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'red' as const,
          },
          plain_text: 'Bold text',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should preserve whitespace in plain_text', () => {
      const richText = [
        {
          type: 'text' as const,
          text: { content: 'test', link: null },
          annotations: baseAnnotations,
          plain_text: '  spaced text  ',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].plain_text).toBe('  spaced text  ');
      }
    });

    it('should preserve whitespace in text content', () => {
      const richText = [
        {
          type: 'text' as const,
          text: { content: '  Some words  ', link: null },
          annotations: baseAnnotations,
          plain_text: '  Some words  ',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
      if (result.success && result.data[0].type === 'text') {
        expect(result.data[0].text.content).toBe('  Some words  ');
      }
    });

    it('should preserve leading and trailing spaces in content', () => {
      const richText = [
        {
          type: 'text' as const,
          text: { content: ' test ', link: null },
          annotations: baseAnnotations,
          plain_text: ' test ',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
      if (result.success && result.data[0].type === 'text') {
        expect(result.data[0].text.content).toBe(' test ');
        expect(result.data[0].plain_text).toBe(' test ');
      }
    });
  });

  describe('mention rich text type', () => {
    it('should parse user mention', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'user' as const,
            user: {
              object: 'user' as const,
              id: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
          annotations: baseAnnotations,
          plain_text: '@John Doe',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse page mention', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'page' as const,
            page: {
              id: '123e4567-e89b-12d3-a456-426614174001',
            },
          },
          annotations: baseAnnotations,
          plain_text: 'Page Link',
          href: 'https://notion.so/page',
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse database mention', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'database' as const,
            database: {
              id: '123e4567-e89b-12d3-a456-426614174002',
            },
          },
          annotations: baseAnnotations,
          plain_text: 'Database',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse date mention', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'date' as const,
            date: {
              start: '2024-01-01',
              end: null,
              time_zone: null,
            },
          },
          annotations: baseAnnotations,
          plain_text: 'Jan 1, 2024',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse date mention with date range', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'date' as const,
            date: {
              start: '2024-01-01',
              end: '2024-12-31',
              time_zone: 'America/New_York',
            },
          },
          annotations: baseAnnotations,
          plain_text: 'Jan 1 - Dec 31, 2024',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
      if (
        result.success &&
        result.data[0].type === 'mention' &&
        result.data[0].mention.type === 'date'
      ) {
        expect(result.data[0].mention.date.start).toBe('2024-01-01');
        expect(result.data[0].mention.date.end).toBe('2024-12-31');
        expect(result.data[0].mention.date.time_zone).toBe('America/New_York');
      }
    });

    it('should parse link_preview mention', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'link_preview' as const,
            link_preview: {
              url: 'https://github.com',
            },
          },
          annotations: baseAnnotations,
          plain_text: 'GitHub',
          href: 'https://github.com',
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse template_mention with today', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'template_mention' as const,
            template_mention: {
              type: 'template_mention_date' as const,
              template_mention_date: 'today' as const,
            },
          },
          annotations: baseAnnotations,
          plain_text: '@today',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse template_mention with now', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'template_mention' as const,
            template_mention: {
              type: 'template_mention_date' as const,
              template_mention_date: 'now' as const,
            },
          },
          annotations: baseAnnotations,
          plain_text: '@now',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse template_mention with me', () => {
      const richText = [
        {
          type: 'mention' as const,
          mention: {
            type: 'template_mention' as const,
            template_mention: {
              type: 'template_mention_user' as const,
              template_mention_user: 'me' as const,
            },
          },
          annotations: baseAnnotations,
          plain_text: '@me',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });
  });

  describe('equation rich text type', () => {
    it('should parse equation', () => {
      const richText = [
        {
          type: 'equation' as const,
          equation: {
            expression: 'E = mc^2',
          },
          annotations: baseAnnotations,
          plain_text: 'E = mc^2',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should preserve whitespace in equation expression', () => {
      const richText = [
        {
          type: 'equation' as const,
          equation: {
            expression: '  E = mc^2  ',
          },
          annotations: baseAnnotations,
          plain_text: 'E = mc^2',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
      if (result.success && result.data[0].type === 'equation') {
        expect(result.data[0].equation.expression).toBe('  E = mc^2  ');
      }
    });

    it('should parse complex LaTeX expression with spacing', () => {
      const richText = [
        {
          type: 'equation' as const,
          equation: {
            expression: '\\frac{ - b \\pm \\sqrt {b^2 - 4ac} }{{2a}}',
          },
          annotations: baseAnnotations,
          plain_text: 'quadratic formula',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
      if (result.success && result.data[0].type === 'equation') {
        expect(result.data[0].equation.expression).toBe(
          '\\frac{ - b \\pm \\sqrt {b^2 - 4ac} }{{2a}}',
        );
      }
    });
  });

  describe('mixed rich text array', () => {
    it('should parse array with multiple types', () => {
      const richText = [
        {
          type: 'text' as const,
          text: { content: 'Hello ', link: null },
          annotations: baseAnnotations,
          plain_text: 'Hello ',
          href: null,
        },
        {
          type: 'mention' as const,
          mention: {
            type: 'user' as const,
            user: {
              object: 'user' as const,
              id: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
          annotations: { ...baseAnnotations, bold: true },
          plain_text: '@John',
          href: null,
        },
        {
          type: 'text' as const,
          text: { content: ' check this ', link: null },
          annotations: baseAnnotations,
          plain_text: ' check this ',
          href: null,
        },
        {
          type: 'equation' as const,
          equation: { expression: 'x^2' },
          annotations: baseAnnotations,
          plain_text: 'x^2',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });

    it('should parse empty rich text array', () => {
      const richText: any[] = [];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(true);
    });
  });

  describe('validation', () => {
    it('should reject invalid URL in text link', () => {
      const richText = [
        {
          type: 'text',
          text: { content: 'test', link: { url: 'not-a-url' } },
          annotations: baseAnnotations,
          plain_text: 'test',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID in mention', () => {
      const richText = [
        {
          type: 'mention',
          mention: {
            type: 'page',
            page: { id: 'not-a-uuid' },
          },
          annotations: baseAnnotations,
          plain_text: 'test',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(false);
    });

    it('should reject invalid rich text type', () => {
      const richText = [
        {
          type: 'invalid',
          annotations: baseAnnotations,
          plain_text: 'test',
          href: null,
        },
      ];

      const result = richTextSchema.safeParse(richText);
      expect(result.success).toBe(false);
    });
  });
});
