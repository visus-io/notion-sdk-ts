import { describe, expect, it } from 'vitest';
import { notionDateStringSchema } from './shared.schema';

describe('notionDateStringSchema', () => {
  it('should accept a date-only string', () => {
    expect(notionDateStringSchema.safeParse('2023-02-23').success).toBe(true);
  });

  it('should accept a UTC date-time string', () => {
    expect(notionDateStringSchema.safeParse('2023-02-23T00:00:00.000Z').success).toBe(true);
  });

  it('should accept a date-time string with a UTC offset', () => {
    expect(notionDateStringSchema.safeParse('2021-10-15T12:00:00.000-04:00').success).toBe(true);
  });

  it('should accept a date-time string with no zone', () => {
    expect(notionDateStringSchema.safeParse('2021-10-15T12:00:00.000').success).toBe(true);
  });

  it('should reject a non-date string', () => {
    expect(notionDateStringSchema.safeParse('not-a-date').success).toBe(false);
  });
});
