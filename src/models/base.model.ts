import type * as z from 'zod';

/**
 * Base class for all Notion models.
 *
 * This class wraps validated data from a schema. It adds methods and logic for each model.
 *
 * @category Client & Core
 */
export abstract class BaseModel<T> {
  protected readonly data: T;

  protected constructor(data: T, schema: z.ZodType<T>) {
    this.data = schema.parse(data);
  }

  /**
   * Returns the raw validated data as a plain object.
   */
  toJSON(): T {
    return structuredClone(this.data);
  }

  /**
   * Returns the object type, for example "page", "block", or "user".
   */
  abstract get object(): string;

  /**
   * Returns the unique identifier.
   */
  abstract get id(): string;
}
