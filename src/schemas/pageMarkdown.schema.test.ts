import { describe, expect, it } from 'vitest';
import { markdownContentResponseSchema, pageMarkdownSchema } from './pageMarkdown.schema';

describe('pageMarkdownSchema', () => {
  it('should parse a GET markdown response', () => {
    const response = {
      object: 'page_markdown' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      markdown: '# Title\n\nSome content.\n',
      truncated: false,
      unknown_block_ids: [],
    };

    const result = pageMarkdownSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should reject when unknown_block_ids exceeds the 100-item limit', () => {
    const response = {
      object: 'page_markdown' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      markdown: '',
      truncated: true,
      unknown_block_ids: new Array(101).fill('123e4567-e89b-12d3-a456-426614174000'),
    };

    const result = pageMarkdownSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe('markdownContentResponseSchema', () => {
  it('should parse a synchronous page_markdown response', () => {
    const response = {
      object: 'page_markdown' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      markdown: 'Updated content',
      truncated: false,
      unknown_block_ids: [],
    };

    const result = markdownContentResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    expect(result.data?.object).toBe('page_markdown');
  });

  it('should parse an async_task response', () => {
    const response = {
      object: 'async_task' as const,
      id: '223e4567-e89b-12d3-a456-426614174000',
      status: 'queued' as const,
      status_url: 'https://api.notion.com/v1/async_tasks/223e4567-e89b-12d3-a456-426614174000',
      created_time: '2026-01-01T00:00:00.000Z',
      operation: { surface: 'rest' as const, name: 'update_page_markdown' },
    };

    const result = markdownContentResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    expect(result.data?.object).toBe('async_task');
  });
});
