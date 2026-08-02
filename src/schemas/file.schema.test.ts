import { describe, expect, it } from 'vitest';
import { fileSchema } from './file.schema';

describe('fileSchema', () => {
  it('should parse notion-hosted file', () => {
    const file = {
      type: 'file' as const,
      file: {
        url: 'https://s3.amazonaws.com/notion/file.pdf',
        expiry_time: '2024-12-31T23:59:59.999Z',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it('should parse file_upload file', () => {
    const file = {
      type: 'file_upload' as const,
      file_upload: {
        id: '123e4567-e89b-12d3-a456-426614174000',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it('should parse external file', () => {
    const file = {
      type: 'external' as const,
      external: {
        url: 'https://example.com/image.png',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const file = {
      type: 'external',
      external: {
        url: 'not-a-url',
      },
    };

    const result = fileSchema.safeParse(file);
    expect(result.success).toBe(false);
  });
});
