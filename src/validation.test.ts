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
  it('should throw for URL exceeding 2000 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(() => prop.url(longUrl)).toThrow(NotionValidationError);
    expect(() => prop.url(longUrl)).toThrow(/URL/);
  });

  it('should accept URL within 2000 characters', () => {
    expect(() => prop.url('https://example.com')).not.toThrow();
  });

  it('should accept null URL', () => {
    expect(() => prop.url(null)).not.toThrow();
  });

  it('should throw for email exceeding 200 characters', () => {
    const longEmail = 'a'.repeat(192) + '@test.com';
    expect(() => prop.email(longEmail)).toThrow(NotionValidationError);
    expect(() => prop.email(longEmail)).toThrow(/Email/);
  });

  it('should accept email within 200 characters', () => {
    expect(() => prop.email('user@example.com')).not.toThrow();
  });

  it('should accept null email', () => {
    expect(() => prop.email(null)).not.toThrow();
  });

  it('should throw for phone number exceeding 200 characters', () => {
    expect(() => prop.phoneNumber('1'.repeat(201))).toThrow(NotionValidationError);
    expect(() => prop.phoneNumber('1'.repeat(201))).toThrow(/Phone number/);
  });

  it('should accept phone number within 200 characters', () => {
    expect(() => prop.phoneNumber('+1-555-0100')).not.toThrow();
  });

  it('should accept null phone number', () => {
    expect(() => prop.phoneNumber(null)).not.toThrow();
  });

  it('should throw for multi-select exceeding 100 options', () => {
    const options = Array.from({ length: 101 }, (_, i) => `option-${i}`);
    expect(() => prop.multiSelect(options)).toThrow(NotionValidationError);
    expect(() => prop.multiSelect(options)).toThrow(/Multi-select options/);
  });

  it('should accept multi-select within 100 options', () => {
    const options = Array.from({ length: 100 }, (_, i) => `option-${i}`);
    expect(() => prop.multiSelect(options)).not.toThrow();
  });

  it('should throw for relation exceeding 100 pages', () => {
    const ids = Array.from({ length: 101 }, (_, i) => `page-${i}`);
    expect(() => prop.relation(ids)).toThrow(NotionValidationError);
    expect(() => prop.relation(ids)).toThrow(/Relation pages/);
  });

  it('should accept relation within 100 pages', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `page-${i}`);
    expect(() => prop.relation(ids)).not.toThrow();
  });

  it('should throw for people exceeding 100 users', () => {
    const ids = Array.from({ length: 101 }, (_, i) => `user-${i}`);
    expect(() => prop.people(ids)).toThrow(NotionValidationError);
    expect(() => prop.people(ids)).toThrow(/People/);
  });

  it('should accept people within 100 users', () => {
    const ids = Array.from({ length: 100 }, (_, i) => `user-${i}`);
    expect(() => prop.people(ids)).not.toThrow();
  });

  it('should throw for title text exceeding 2000 characters', () => {
    expect(() => prop.title('a'.repeat(2001))).toThrow(NotionValidationError);
  });

  it('should throw for richText text exceeding 2000 characters', () => {
    expect(() => prop.richText('a'.repeat(2001))).toThrow(NotionValidationError);
  });
});
