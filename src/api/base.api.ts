import type { NotionClient } from '../client';
import type { PaginationParameters } from '../schemas';
import { LIMITS, validateArrayLength } from '../validation';

/**
 * Base API class providing common functionality for all Notion API clients.
 */
export abstract class BaseAPI {
  protected constructor(protected readonly client: NotionClient) {}

  /**
   * Build pagination query parameters from PaginationParameters.
   *
   * @param params - Optional pagination parameters
   * @returns Query object with pagination parameters for API requests
   *
   * @example
   * const query = this.buildPaginationQuery({ page_size: 50, start_cursor: 'abc123' });
   * // query will be: { page_size: '50', start_cursor: 'abc123' }
   */
  protected buildPaginationQuery(params?: PaginationParameters): Record<string, string> {
    const query: Record<string, string> = {};

    if (params?.page_size) {
      query.page_size = String(params.page_size);
    }

    if (params?.start_cursor) {
      query.start_cursor = params.start_cursor;
    }

    return query;
  }

  /**
   * Build filter_properties query parameter from an array of property names.
   *
   * @param filterProperties - Optional array of property names to include in the response
   * @returns Query object with filter_properties parameter for API requests
   *
   * @throws {NotionValidationError} If array exceeds LIMITS.ARRAY_ELEMENTS
   *
   * @example
   * const query = this.buildFilterPropertiesQuery(['Name', 'Status']);
   * // query will be: { filter_properties: 'Name,Status' }
   */
  protected buildFilterPropertiesQuery(filterProperties?: string[]): Record<string, string> {
    const query: Record<string, string> = {};

    if (filterProperties) {
      validateArrayLength(filterProperties, LIMITS.ARRAY_ELEMENTS, 'filter_properties');

      query.filter_properties = filterProperties.join(',');
    }

    return query;
  }
}
