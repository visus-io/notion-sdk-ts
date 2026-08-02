import type { NotionClient } from '../client';
import { NotionRequestTimeoutError } from '../errors';
import { AsyncTask } from '../models';
import { asyncTaskSchema, type NotionAsyncTask } from '../schemas';
import { BaseAPI } from './base.api';

/**
 * Options for polling an async task until completion.
 */
export interface PollAsyncTaskOptions {
  /** Maximum time to wait for the task to complete, in milliseconds (default: 300000 / 5 minutes) */
  timeoutMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Async Tasks API client for polling long-running Notion operations.
 */
export class AsyncTasksAPI extends BaseAPI<NotionAsyncTask, AsyncTask> {
  protected config = {
    schema: asyncTaskSchema,
    ModelClass: AsyncTask,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Retrieve the current status of an async task.
   *
   * @param taskId - The ID of the async task to retrieve
   * @returns The task wrapped in an AsyncTask model
   *
   * @see https://developers.notion.com/reference/retrieve-async-task
   */
  async retrieve(taskId: string): Promise<AsyncTask> {
    return this.retrieveResource(`/async_tasks/${taskId}`);
  }

  /**
   * Poll an async task until it reaches a terminal status (succeeded or failed),
   * waiting at least `poll_after_seconds` (from the response body, not a header)
   * between polls, per the API's guidance.
   *
   * @param taskId - The ID of the async task to poll
   * @param options - Polling options
   * @returns The task wrapped in an AsyncTask model, once it reaches a terminal status
   *
   * @throws {NotionRequestTimeoutError} If the task doesn't complete within `timeoutMs`
   */
  async poll(taskId: string, options?: PollAsyncTaskOptions): Promise<AsyncTask> {
    const deadline = Date.now() + (options?.timeoutMs ?? 300_000);

    for (;;) {
      const task = await this.retrieve(taskId);

      if (task.isTerminal()) {
        return task;
      }

      if (Date.now() >= deadline) {
        throw new NotionRequestTimeoutError(`Task ${taskId} did not complete within timeout`);
      }

      await sleep(Math.max((task.pollAfterSeconds ?? 1) * 1000, 250));
    }
  }
}
