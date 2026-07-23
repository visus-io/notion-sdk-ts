import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  NotionValidationError,
  validateArrayLength,
  validateStringLength,
} from './validation';
import { richText } from './helpers/richText.helpers';
import { block } from './helpers/block.helpers';
import { prop } from './helpers/property.helpers';

// ---------------------------------------------------------------------------
// Core validation functions
// ---------------------------------------------------------------------------

describe('validateStringLength', () => {
  it('should accept strings within the limit', () => {
    expect(() => validateStringLength('hello', 10, 'test')).not.toThrow();
  });

  it('should accept strings exactly at the limit', () => {
    expect(() => validateStringLength('a'.repeat(2000), 2000, 'test')).not.toThrow();
  });

  it('should throw for strings exceeding the limit', () => {
    expect(() => validateStringLength('a'.repeat(2001), 2000, 'test')).toThrow(
      NotionValidationError,
    );
  });

  it('should include the limit and actual length in the error message', () => {
    expect(() => validateStringLength('a'.repeat(2001), 2000, 'Test field')).toThrow(
      'Test field exceeds the 2000-character limit (got 2001)',
    );
  });
});

describe('validateArrayLength', () => {
  it('should accept arrays within the limit', () => {
    expect(() => validateArrayLength([1, 2, 3], 100, 'test')).not.toThrow();
  });

  it('should accept arrays exactly at the limit', () => {
    expect(() => validateArrayLength(new Array(100), 100, 'test')).not.toThrow();
  });

  it('should throw for arrays exceeding the limit', () => {
    expect(() => validateArrayLength(new Array(101), 100, 'test')).toThrow(NotionValidationError);
  });

  it('should include the limit and actual length in the error message', () => {
    expect(() => validateArrayLength(new Array(101), 100, 'Items')).toThrow(
      'Items exceeds the 100-element limit (got 101)',
    );
  });
});

// ---------------------------------------------------------------------------
// LIMITS constants
// ---------------------------------------------------------------------------

describe('LIMITS', () => {
  it('should have correct values per Notion API docs', () => {
    expect(LIMITS.RICH_TEXT_CONTENT).toBe(2_000);
    expect(LIMITS.RICH_TEXT_LINK_URL).toBe(2_000);
    expect(LIMITS.EQUATION_EXPRESSION).toBe(1_000);
    expect(LIMITS.ARRAY_ELEMENTS).toBe(100);
    expect(LIMITS.URL).toBe(2_000);
    expect(LIMITS.EMAIL).toBe(200);
    expect(LIMITS.PHONE_NUMBER).toBe(200);
    expect(LIMITS.MULTI_SELECT).toBe(100);
    expect(LIMITS.RELATION).toBe(100);
    expect(LIMITS.PEOPLE).toBe(100);
    expect(LIMITS.COMMENT_ATTACHMENTS).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// NotionValidationError
// ---------------------------------------------------------------------------

describe('NotionValidationError', () => {
  it('should have the correct name', () => {
    const error = new NotionValidationError('test');
    expect(error.name).toBe('NotionValidationError');
  });

  it('should be an instance of Error', () => {
    const error = new NotionValidationError('test');
    expect(error).toBeInstanceOf(Error);
  });

  it('should carry the message', () => {
    const error = new NotionValidationError('something went wrong');
    expect(error.message).toBe('something went wrong');
  });
});

// ---------------------------------------------------------------------------
// Helper-level validation: richText
// ---------------------------------------------------------------------------

describe('richText helper validation', () => {
  it('should accept text within 2000 characters', () => {
    expect(() => richText('a'.repeat(2000))).not.toThrow();
  });

  it('should throw for text exceeding 2000 characters', () => {
    expect(() => richText('a'.repeat(2001))).toThrow(NotionValidationError);
    expect(() => richText('a'.repeat(2001))).toThrow(/Rich text content/);
  });

  it('should throw for link URL exceeding 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(() => richText('text').link(longUrl)).toThrow(NotionValidationError);
    expect(() => richText('text').link(longUrl)).toThrow(/Rich text link URL/);
  });

  it('should accept link URL within 2000 characters', () => {
    expect(() => richText('text').link('https://example.com')).not.toThrow();
  });

  it('should throw for equation expression exceeding 1000 characters', () => {
    expect(() => richText.equation('x'.repeat(1001))).toThrow(NotionValidationError);
    expect(() => richText.equation('x'.repeat(1001))).toThrow(/Equation expression/);
  });

  it('should accept equation expression within 1000 characters', () => {
    expect(() => richText.equation('x'.repeat(1000))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Helper-level validation: block
// ---------------------------------------------------------------------------

describe('block helper validation', () => {
  it('should throw for paragraph text exceeding 2000 characters', () => {
    expect(() => block.paragraph('a'.repeat(2001))).toThrow(NotionValidationError);
  });

  it('should accept paragraph text within 2000 characters', () => {
    expect(() => block.paragraph('a'.repeat(2000))).not.toThrow();
  });

  it('should throw for equation expression exceeding 1000 characters', () => {
    expect(() => block.equation('x'.repeat(1001))).toThrow(NotionValidationError);
  });

  it('should throw for embed URL exceeding 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(() => block.embed(longUrl)).toThrow(NotionValidationError);
  });

  it('should throw for bookmark URL exceeding 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(() => block.bookmark(longUrl)).toThrow(NotionValidationError);
  });

  it('should throw for linkPreview URL exceeding 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(() => block.linkPreview(longUrl)).toThrow(NotionValidationError);
  });

  it('should throw for image URL exceeding 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(() => block.image(longUrl)).toThrow(NotionValidationError);
  });

  it('should accept image with FileSource object (no URL validation)', () => {
    expect(() => block.image({ type: 'file_upload', file_upload: { id: 'id' } })).not.toThrow();
  });

  it('should throw for heading text exceeding 2000 characters', () => {
    expect(() => block.heading1('a'.repeat(2001))).toThrow(NotionValidationError);
    expect(() => block.heading2('a'.repeat(2001))).toThrow(NotionValidationError);
    expect(() => block.heading3('a'.repeat(2001))).toThrow(NotionValidationError);
  });

  it('should throw for code block content exceeding 2000 characters', () => {
    expect(() => block.code('a'.repeat(2001), 'typescript')).toThrow(NotionValidationError);
  });
});

// ---------------------------------------------------------------------------
// Helper-level validation: prop
// ---------------------------------------------------------------------------

describe('prop helper validation', () => {
  it.each([
    {
      name: 'URL',
      limit: 2000,
      pattern: /URL/,
      buildOverLimit: () => prop.url('https://example.com/' + 'a'.repeat(2000)),
      buildWithinLimit: () => prop.url('https://example.com'),
    },
    {
      name: 'email',
      limit: 200,
      pattern: /Email/,
      buildOverLimit: () => prop.email('a'.repeat(192) + '@test.com'),
      buildWithinLimit: () => prop.email('user@example.com'),
    },
    {
      name: 'phone number',
      limit: 200,
      pattern: /Phone number/,
      buildOverLimit: () => prop.phoneNumber('1'.repeat(201)),
      buildWithinLimit: () => prop.phoneNumber('+1-555-0100'),
    },
  ])('should throw for $name exceeding $limit characters', ({ buildOverLimit, pattern }) => {
    expect(buildOverLimit).toThrow(NotionValidationError);
    expect(buildOverLimit).toThrow(pattern);
  });

  it.each([
    { name: 'URL', build: () => prop.url('https://example.com') },
    { name: 'email', build: () => prop.email('user@example.com') },
    { name: 'phone number', build: () => prop.phoneNumber('+1-555-0100') },
  ])('should accept $name within limit', ({ build }) => {
    expect(build).not.toThrow();
  });

  it.each([
    { name: 'URL', build: () => prop.url(null) },
    { name: 'email', build: () => prop.email(null) },
    { name: 'phone number', build: () => prop.phoneNumber(null) },
  ])('should accept null $name', ({ build }) => {
    expect(build).not.toThrow();
  });

  it.each([
    {
      name: 'multi-select options',
      limit: 100,
      pattern: /Multi-select options/,
      buildWith: (n: number) =>
        prop.multiSelect(Array.from({ length: n }, (_, i) => `option-${i}`)),
    },
    {
      name: 'relation pages',
      limit: 100,
      pattern: /Relation pages/,
      buildWith: (n: number) => prop.relation(Array.from({ length: n }, (_, i) => `page-${i}`)),
    },
    {
      name: 'people',
      limit: 100,
      pattern: /People/,
      buildWith: (n: number) => prop.people(Array.from({ length: n }, (_, i) => `user-${i}`)),
    },
  ])('should throw for $name exceeding $limit', ({ buildWith, limit, pattern }) => {
    expect(() => buildWith(limit + 1)).toThrow(NotionValidationError);
    expect(() => buildWith(limit + 1)).toThrow(pattern);
  });

  it.each([
    {
      name: 'multi-select options',
      limit: 100,
      buildWith: (n: number) =>
        prop.multiSelect(Array.from({ length: n }, (_, i) => `option-${i}`)),
    },
    {
      name: 'relation pages',
      limit: 100,
      buildWith: (n: number) => prop.relation(Array.from({ length: n }, (_, i) => `page-${i}`)),
    },
    {
      name: 'people',
      limit: 100,
      buildWith: (n: number) => prop.people(Array.from({ length: n }, (_, i) => `user-${i}`)),
    },
  ])('should accept $name within $limit', ({ buildWith, limit }) => {
    expect(() => buildWith(limit)).not.toThrow();
  });

  it('should throw for title text exceeding 2000 characters', () => {
    expect(() => prop.title('a'.repeat(2001))).toThrow(NotionValidationError);
  });

  it('should throw for richText text exceeding 2000 characters', () => {
    expect(() => prop.richText('a'.repeat(2001))).toThrow(NotionValidationError);
  });
});
