import type { ZodType } from 'zod';

/**
 * Base model class providing common functionality for all Notion models.
 * Models wrap validated data from schemas with methods and business logic.
 */
export abstract class BaseModel<T> {
  protected readonly data: T;

  protected constructor(data: T, schema: ZodType<T>) {
    this.data = schema.parse(data);
  }

  /**
   * Returns the raw validated data as a plain object.
   */
  toJSON(): T {
    return structuredClone(this.data);
  }

  /**
   * Returns the object type (e.g., "page", "block", "user").
   */
  abstract get object(): string;

  /**
   * Returns the unique identifier.
   */
  abstract get id(): string;
}
