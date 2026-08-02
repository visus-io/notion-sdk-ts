import { describe, expect, it } from 'vitest';
import { asyncTaskSchema } from './asyncTask.schema';

describe('asyncTaskSchema', () => {
  it('should parse a minimal queued task', () => {
    const task = {
      object: 'async_task' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'queued' as const,
      status_url: 'https://api.notion.com/v1/async_tasks/123e4567-e89b-12d3-a456-426614174000',
      created_time: '2026-01-01T00:00:00.000Z',
      operation: { surface: 'rest' as const, name: 'update_page_markdown' },
    };

    const result = asyncTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
  });

  it('should parse a succeeded task with a result', () => {
    const task = {
      object: 'async_task' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'succeeded' as const,
      status_url: 'https://api.notion.com/v1/async_tasks/123e4567-e89b-12d3-a456-426614174000',
      created_time: '2026-01-01T00:00:00.000Z',
      operation: { surface: 'rest' as const, name: 'update_page_markdown' },
      poll_after_seconds: 2,
      result: { object: 'page_markdown', id: '223e4567-e89b-12d3-a456-426614174000' },
    };

    const result = asyncTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
    expect(result.data?.result).toEqual({
      object: 'page_markdown',
      id: '223e4567-e89b-12d3-a456-426614174000',
    });
  });

  it('should parse a failed task with an error', () => {
    const task = {
      object: 'async_task' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'failed' as const,
      status_url: 'https://api.notion.com/v1/async_tasks/123e4567-e89b-12d3-a456-426614174000',
      created_time: '2026-01-01T00:00:00.000Z',
      operation: { surface: 'rest' as const, name: 'update_page_markdown' },
      error: {
        object: 'error' as const,
        status: 400,
        code: 'validation_error',
        message: 'old_str not found',
      },
    };

    const result = asyncTaskSchema.safeParse(task);
    expect(result.success).toBe(true);
    expect(result.data?.error?.message).toBe('old_str not found');
  });

  it('should reject an invalid status', () => {
    const task = {
      object: 'async_task' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'unknown_status',
      status_url: 'https://api.notion.com/v1/async_tasks/123e4567-e89b-12d3-a456-426614174000',
      created_time: '2026-01-01T00:00:00.000Z',
      operation: { surface: 'rest' as const, name: 'update_page_markdown' },
    };

    const result = asyncTaskSchema.safeParse(task);
    expect(result.success).toBe(false);
  });
});
