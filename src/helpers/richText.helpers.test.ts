import { describe, expect, it } from 'vitest';
import { RichTextBuilder, richText } from './richText.helpers';

describe('richText helpers', () => {
  describe('richText() — text builder', () => {
    it('should create a plain text segment', () => {
      const result = richText('Hello world').build();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'text',
        text: { content: 'Hello world', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Hello world',
        href: null,
      });
    });

    it('should return a RichTextBuilder instance', () => {
      expect(richText('test')).toBeInstanceOf(RichTextBuilder);
    });
  });

  describe('annotation chaining', () => {
    it('should apply bold', () => {
      const [segment] = richText('Bold').bold().build();
      expect(segment.annotations.bold).toBe(true);
      expect(segment.annotations.italic).toBe(false);
    });

    it('should apply italic', () => {
      const [segment] = richText('Italic').italic().build();
      expect(segment.annotations.italic).toBe(true);
    });

    it('should apply strikethrough', () => {
      const [segment] = richText('Strike').strikethrough().build();
      expect(segment.annotations.strikethrough).toBe(true);
    });

    it('should apply underline', () => {
      const [segment] = richText('Underline').underline().build();
      expect(segment.annotations.underline).toBe(true);
    });

    it('should apply code', () => {
      const [segment] = richText('Code').code().build();
      expect(segment.annotations.code).toBe(true);
    });

    it('should apply color', () => {
      const [segment] = richText('Red').color('red').build();
      expect(segment.annotations.color).toBe('red');
    });

    it('should apply background color', () => {
      const [segment] = richText('Highlighted').color('yellow_background').build();
      expect(segment.annotations.color).toBe('yellow_background');
    });

    it('should chain multiple annotations', () => {
      const [segment] = richText('Styled').bold().italic().underline().color('blue').build();
      expect(segment.annotations).toEqual({
        bold: true,
        italic: true,
        strikethrough: false,
        underline: true,
        code: false,
        color: 'blue',
      });
    });

    it('should chain all annotations at once', () => {
      const [segment] = richText('All')
        .bold()
        .italic()
        .strikethrough()
        .underline()
        .code()
        .color('red')
        .build();
      expect(segment.annotations).toEqual({
        bold: true,
        italic: true,
        strikethrough: true,
        underline: true,
        code: true,
        color: 'red',
      });
    });
  });

  describe('link()', () => {
    it('should add a link to a text segment', () => {
      const [segment] = richText('Click me').link('https://example.com').build();
      expect(segment.type).toBe('text');
      if (segment.type === 'text') {
        expect(segment.text.link).toEqual({ url: 'https://example.com' });
      }
      expect(segment.href).toBe('https://example.com');
    });

    it('should combine link with annotations', () => {
      const [segment] = richText('Bold link').bold().link('https://example.com').build();
      expect(segment.annotations.bold).toBe(true);
      expect(segment.href).toBe('https://example.com');
    });

    it('should be a no-op on non-text segments', () => {
      const [segment] = richText.equation('E=mc^2').link('https://example.com').build();
      expect(segment.type).toBe('equation');
      expect(segment.href).toBeNull();
    });
  });

  describe('richText.mentionPage()', () => {
    it('should create a page mention', () => {
      const id = '12345678-1234-1234-1234-123456789abc';
      const [segment] = richText.mentionPage(id).build();

      expect(segment.type).toBe('mention');
      if (segment.type === 'mention') {
        expect(segment.mention).toEqual({ type: 'page', page: { id } });
      }
      expect(segment.plain_text).toBe(id);
    });

    it('should support annotations on page mentions', () => {
      const id = '12345678-1234-1234-1234-123456789abc';
      const [segment] = richText.mentionPage(id).bold().build();
      expect(segment.annotations.bold).toBe(true);
    });
  });

  describe('richText.mentionDatabase()', () => {
    it('should create a database mention', () => {
      const id = '12345678-1234-1234-1234-123456789abc';
      const [segment] = richText.mentionDatabase(id).build();

      expect(segment.type).toBe('mention');
      if (segment.type === 'mention') {
        expect(segment.mention).toEqual({ type: 'database', database: { id } });
      }
    });
  });

  describe('richText.mentionUser()', () => {
    it('should create a user mention with a partial user', () => {
      const user = { object: 'user' as const, id: '12345678-1234-1234-1234-123456789abc' };
      const [segment] = richText.mentionUser(user).build();

      expect(segment.type).toBe('mention');
      if (segment.type === 'mention') {
        expect(segment.mention).toEqual({ type: 'user', user });
      }
      // Partial user has no name, so plain_text falls back to id
      expect(segment.plain_text).toBe(user.id);
    });

    it('should use name for plain_text when available', () => {
      const user = {
        object: 'user' as const,
        id: '12345678-1234-1234-1234-123456789abc',
        type: 'person' as const,
        name: 'Jane Doe',
        person: { email: 'jane@example.com' },
      };
      const [segment] = richText.mentionUser(user).build();
      expect(segment.plain_text).toBe('Jane Doe');
    });
  });

  describe('richText.mentionDate()', () => {
    it('should create a date mention with just a start date', () => {
      const [segment] = richText.mentionDate('2025-01-15').build();

      expect(segment.type).toBe('mention');
      if (segment.type === 'mention') {
        expect(segment.mention).toEqual({
          type: 'date',
          date: { start: '2025-01-15', end: null, time_zone: null },
        });
      }
      expect(segment.plain_text).toBe('2025-01-15');
    });

    it('should create a date mention with end date and time zone', () => {
      const [segment] = richText
        .mentionDate('2025-01-15', { end: '2025-01-20', time_zone: 'America/New_York' })
        .build();

      if (segment.type === 'mention') {
        expect(segment.mention).toEqual({
          type: 'date',
          date: {
            start: '2025-01-15',
            end: '2025-01-20',
            time_zone: 'America/New_York',
          },
        });
      }
    });
  });

  describe('richText.mentionLinkPreview()', () => {
    it('should create a link preview mention', () => {
      const url = 'https://example.com/article';
      const [segment] = richText.mentionLinkPreview(url).build();

      expect(segment.type).toBe('mention');
      if (segment.type === 'mention') {
        expect(segment.mention).toEqual({
          type: 'link_preview',
          link_preview: { url },
        });
      }
      expect(segment.href).toBe(url);
      expect(segment.plain_text).toBe(url);
    });
  });

  describe('richText.equation()', () => {
    it('should create an equation segment', () => {
      const [segment] = richText.equation('E=mc^2').build();

      expect(segment.type).toBe('equation');
      if (segment.type === 'equation') {
        expect(segment.equation.expression).toBe('E=mc^2');
      }
      expect(segment.plain_text).toBe('E=mc^2');
    });

    it('should support annotations on equations', () => {
      const [segment] = richText.equation('x^2').bold().color('red').build();
      expect(segment.annotations.bold).toBe(true);
      expect(segment.annotations.color).toBe('red');
    });
  });

  describe('richText.join()', () => {
    it('should combine multiple builders into a single array', () => {
      const result = richText.join(richText('Hello '), richText('world').bold(), richText('!'));

      expect(result).toHaveLength(3);
      expect(result[0].plain_text).toBe('Hello ');
      expect(result[1].plain_text).toBe('world');
      expect(result[1].annotations.bold).toBe(true);
      expect(result[2].plain_text).toBe('!');
    });

    it('should accept pre-built NotionRichText arrays', () => {
      const preBuilt = richText('pre-built').build();
      const result = richText.join(richText('before '), preBuilt, richText(' after'));

      expect(result).toHaveLength(3);
      expect(result[0].plain_text).toBe('before ');
      expect(result[1].plain_text).toBe('pre-built');
      expect(result[2].plain_text).toBe(' after');
    });

    it('should handle mixing builders and arrays', () => {
      const arr = richText.join(richText('a').bold(), richText('b').italic());
      const result = richText.join(richText('start '), arr, richText(' end'));

      // arr has 2 elements, so result has 4
      expect(result).toHaveLength(4);
    });

    it('should handle a single builder', () => {
      const result = richText.join(richText('alone'));
      expect(result).toHaveLength(1);
      expect(result[0].plain_text).toBe('alone');
    });

    it('should handle empty input', () => {
      const result = richText.join();
      expect(result).toHaveLength(0);
    });

    it('should combine different segment types', () => {
      const result = richText.join(
        richText('See equation: '),
        richText.equation('E=mc^2'),
        richText(' on page '),
        richText.mentionPage('12345678-1234-1234-1234-123456789abc'),
      );

      expect(result).toHaveLength(4);
      expect(result[0].type).toBe('text');
      expect(result[1].type).toBe('equation');
      expect(result[2].type).toBe('text');
      expect(result[3].type).toBe('mention');
    });
  });

  describe('immutability', () => {
    it('should not share annotation state between builds', () => {
      const builder = richText('test');
      const plain = builder.build();

      builder.bold();
      const bold = builder.build();

      expect(plain[0].annotations.bold).toBe(false);
      expect(bold[0].annotations.bold).toBe(true);
    });

    it('should not mutate previously built results', () => {
      const first = richText('text').bold().build();
      const second = richText('text').italic().build();

      expect(first[0].annotations.bold).toBe(true);
      expect(first[0].annotations.italic).toBe(false);
      expect(second[0].annotations.bold).toBe(false);
      expect(second[0].annotations.italic).toBe(true);
    });
  });
});
