import { describe, expect, it } from 'vitest';
import { AsyncTask } from '.';

describe('AsyncTask', () => {
  const baseTask = {
    object: 'async_task' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
    status_url: 'https://api.notion.com/v1/async_tasks/123e4567-e89b-12d3-a456-426614174000',
    created_time: '2026-01-01T00:00:00.000Z',
    operation: { surface: 'rest' as const, name: 'update_page_markdown' },
  };

  it('should expose getters for a queued task', () => {
    const task = new AsyncTask({ ...baseTask, status: 'queued', poll_after_seconds: 2 });

    expect(task.object).toBe('async_task');
    expect(task.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(task.status).toBe('queued');
    expect(task.statusUrl).toBe(baseTask.status_url);
    expect(task.createdTime).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(task.operation).toEqual({ surface: 'rest', name: 'update_page_markdown' });
    expect(task.pollAfterSeconds).toBe(2);
    expect(task.result).toBeUndefined();
    expect(task.error).toBeUndefined();
  });

  it.each([
    { status: 'queued', isSucceeded: false, isFailed: false, isTerminal: false },
    { status: 'running', isSucceeded: false, isFailed: false, isTerminal: false },
    { status: 'retrying', isSucceeded: false, isFailed: false, isTerminal: false },
    { status: 'succeeded', isSucceeded: true, isFailed: false, isTerminal: true },
    { status: 'failed', isSucceeded: false, isFailed: true, isTerminal: true },
  ] as const)('should identify $status tasks', ({ status, isSucceeded, isFailed, isTerminal }) => {
    const task = new AsyncTask({ ...baseTask, status });

    expect(task.isSucceeded()).toBe(isSucceeded);
    expect(task.isFailed()).toBe(isFailed);
    expect(task.isTerminal()).toBe(isTerminal);
  });

  it('should expose the result on a succeeded task', () => {
    const task = new AsyncTask({
      ...baseTask,
      status: 'succeeded',
      result: { object: 'page_markdown', id: '223e4567-e89b-12d3-a456-426614174000' },
    });

    expect(task.result).toEqual({
      object: 'page_markdown',
      id: '223e4567-e89b-12d3-a456-426614174000',
    });
  });

  it('should expose the error on a failed task', () => {
    const task = new AsyncTask({
      ...baseTask,
      status: 'failed',
      error: {
        object: 'error',
        status: 400,
        code: 'validation_error',
        message: 'old_str not found',
      },
    });

    expect(task.error).toEqual({
      object: 'error',
      status: 400,
      code: 'validation_error',
      message: 'old_str not found',
    });
  });
});
