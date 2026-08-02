import { BaseModel } from './base.model';
import { asyncTaskSchema, type NotionAsyncTask } from '../schemas';

/**
 * AsyncTask model class with helper methods.
 *
 * Represents a long-running operation, for example an async markdown write. Poll the
 * task until it reaches a terminal status.
 *
 * @category Async Tasks
 */
export class AsyncTask extends BaseModel<NotionAsyncTask> {
  constructor(data: NotionAsyncTask) {
    super(data, asyncTaskSchema);
  }

  /**
   * Returns "async_task" - the object type.
   */
  get object(): 'async_task' {
    return this.data.object;
  }

  /**
   * Returns the task ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the task status.
   */
  get status(): NotionAsyncTask['status'] {
    return this.data.status;
  }

  /**
   * Returns the URL to poll for the task status.
   */
  get statusUrl(): string {
    return this.data.status_url;
  }

  /**
   * Returns the task creation time as a Date object.
   */
  get createdTime(): Date {
    return new Date(this.data.created_time);
  }

  /**
   * Returns the operation that created this task.
   */
  get operation(): NotionAsyncTask['operation'] {
    return this.data.operation;
  }

  /**
   * Returns the minimum number of seconds to wait before polling again, if provided.
   */
  get pollAfterSeconds(): number | undefined {
    return this.data.poll_after_seconds;
  }

  /**
   * Returns the operation-specific result, present only when the task succeeded.
   */
  get result(): unknown {
    return this.data.result;
  }

  /**
   * Returns the error details, present only when the task failed.
   */
  get error(): NotionAsyncTask['error'] {
    return this.data.error;
  }

  /**
   * Returns whether the task completed successfully.
   */
  isSucceeded(): boolean {
    return this.data.status === 'succeeded';
  }

  /**
   * Returns whether the task failed.
   */
  isFailed(): boolean {
    return this.data.status === 'failed';
  }

  /**
   * Returns whether the task has reached a terminal status (succeeded or failed).
   */
  isTerminal(): boolean {
    return this.isSucceeded() || this.isFailed();
  }
}
