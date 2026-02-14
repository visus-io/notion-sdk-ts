import { describe, expect, it } from 'vitest';
import { prop } from './property.helpers';
import { richText } from './richText.helpers';

describe('property helpers', () => {
  describe('title', () => {
    it('should create a title property from a string', () => {
      const result = prop.title('My Page');
      expect(result.title).toHaveLength(1);
      expect(result.title[0].plain_text).toBe('My Page');
    });

    it('should accept a RichTextBuilder', () => {
      const result = prop.title(richText('Bold Title').bold());
      expect(result.title[0].annotations.bold).toBe(true);
    });

    it('should accept a pre-built NotionRichText array', () => {
      const preBuilt = richText('Pre-built').italic().build();
      const result = prop.title(preBuilt);
      expect(result.title).toHaveLength(1);
      expect(result.title[0].plain_text).toBe('Pre-built');
      expect(result.title[0].annotations.italic).toBe(true);
    });
  });

  describe('richText', () => {
    it('should create a rich text property from a string', () => {
      const result = prop.richText('Some notes');
      expect(result.rich_text).toHaveLength(1);
      expect(result.rich_text[0].plain_text).toBe('Some notes');
    });

    it('should accept a RichTextBuilder', () => {
      const result = prop.richText(richText('Italic').italic());
      expect(result.rich_text[0].annotations.italic).toBe(true);
    });
  });

  describe('number', () => {
    it('should create a number property', () => {
      expect(prop.number(42)).toEqual({ number: 42 });
    });

    it('should accept null to clear', () => {
      expect(prop.number(null)).toEqual({ number: null });
    });

    it('should handle zero', () => {
      expect(prop.number(0)).toEqual({ number: 0 });
    });
  });

  describe('checkbox', () => {
    it('should create a true checkbox', () => {
      expect(prop.checkbox(true)).toEqual({ checkbox: true });
    });

    it('should create a false checkbox', () => {
      expect(prop.checkbox(false)).toEqual({ checkbox: false });
    });
  });

  describe('select', () => {
    it('should create a select property', () => {
      expect(prop.select('Option A')).toEqual({ select: { name: 'Option A' } });
    });

    it('should accept null to clear', () => {
      expect(prop.select(null)).toEqual({ select: null });
    });
  });

  describe('multiSelect', () => {
    it('should create a multi-select property', () => {
      expect(prop.multiSelect(['Tag1', 'Tag2'])).toEqual({
        multi_select: [{ name: 'Tag1' }, { name: 'Tag2' }],
      });
    });

    it('should handle empty array', () => {
      expect(prop.multiSelect([])).toEqual({ multi_select: [] });
    });
  });

  describe('status', () => {
    it('should create a status property', () => {
      expect(prop.status('In Progress')).toEqual({ status: { name: 'In Progress' } });
    });

    it('should accept null to clear', () => {
      expect(prop.status(null)).toEqual({ status: null });
    });
  });

  describe('date', () => {
    it('should create a date with just a start', () => {
      expect(prop.date('2025-01-15')).toEqual({
        date: { start: '2025-01-15', end: null, time_zone: null },
      });
    });

    it('should create a date with end and time zone', () => {
      expect(prop.date('2025-01-15', { end: '2025-01-20', timeZone: 'America/New_York' })).toEqual({
        date: {
          start: '2025-01-15',
          end: '2025-01-20',
          time_zone: 'America/New_York',
        },
      });
    });

    it('should accept null to clear', () => {
      expect(prop.date(null)).toEqual({ date: null });
    });
  });

  describe('url', () => {
    it('should create a URL property', () => {
      expect(prop.url('https://example.com')).toEqual({ url: 'https://example.com' });
    });

    it('should accept null', () => {
      expect(prop.url(null)).toEqual({ url: null });
    });
  });

  describe('email', () => {
    it('should create an email property', () => {
      expect(prop.email('user@example.com')).toEqual({ email: 'user@example.com' });
    });

    it('should accept null', () => {
      expect(prop.email(null)).toEqual({ email: null });
    });
  });

  describe('phoneNumber', () => {
    it('should create a phone number property', () => {
      expect(prop.phoneNumber('+1-555-0100')).toEqual({ phone_number: '+1-555-0100' });
    });

    it('should accept null', () => {
      expect(prop.phoneNumber(null)).toEqual({ phone_number: null });
    });
  });

  describe('relation', () => {
    it('should create a relation property', () => {
      expect(prop.relation(['id-1', 'id-2'])).toEqual({
        relation: [{ id: 'id-1' }, { id: 'id-2' }],
      });
    });

    it('should handle empty array', () => {
      expect(prop.relation([])).toEqual({ relation: [] });
    });
  });

  describe('people', () => {
    it('should create a people property', () => {
      expect(prop.people(['user-1', 'user-2'])).toEqual({
        people: [
          { object: 'user', id: 'user-1' },
          { object: 'user', id: 'user-2' },
        ],
      });
    });
  });

  describe('files', () => {
    it('should create a files property', () => {
      expect(prop.files([{ name: 'doc.pdf', url: 'https://example.com/doc.pdf' }])).toEqual({
        files: [
          {
            name: 'doc.pdf',
            type: 'external',
            external: { url: 'https://example.com/doc.pdf' },
          },
        ],
      });
    });

    it('should handle multiple files', () => {
      const result = prop.files([
        { name: 'a.pdf', url: 'https://example.com/a.pdf' },
        { name: 'b.pdf', url: 'https://example.com/b.pdf' },
      ]);
      expect(result.files).toHaveLength(2);
    });
  });
});
