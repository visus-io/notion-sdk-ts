import type * as z from 'zod';

/**
 * Internal marker for trusted, already-validated data.
 *
 * Pass this to a model constructor to skip re-parsing data an API module already
 * validated. This symbol is not exported from the package's public barrel, so
 * external consumers can never construct or forge it. Direct construction from
 * outside the SDK always validates.
 */
export const TRUSTED = Symbol('trusted');

/**
 * Base class for all Notion models.
 *
 * This class wraps validated data from a schema. It adds methods and logic for each model.
 *
 * @category Client & Core
 */
export abstract class BaseModel<T> {
  protected readonly data: T;

  protected constructor(data: T, schema: z.ZodType<T>, trusted?: typeof TRUSTED) {
    this.data = trusted === TRUSTED ? data : schema.parse(data);
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
