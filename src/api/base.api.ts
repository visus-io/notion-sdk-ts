import type { NotionClient } from '../client';
import type { PaginationParameters } from '../schemas';
import { LIMITS, validateArrayLength } from '../validation';

/**
 * Base API class providing common functionality for all Notion API clients.
 */
export abstract class BaseAPI {
  protected constructor(protected readonly client: NotionClient) {}

  /**
   * Build filter_properties body parameter from an array of property names.
   *
   * @param filterProperties - Optional array of property names to include in the response
   * @returns Body object with filter_properties parameter for API requests
   *
   * @throws {NotionValidationError} If array exceeds LIMITS.ARRAY_ELEMENTS
   * @example
   * const body = this.buildFilterPropertiesBody(['Name', 'Status']);
   * // body will be: { filter_properties: ['Name', 'Status'] }
   */
  protected buildFilterPropertiesBody(filterProperties?: string[]): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    if (filterProperties) {
      validateArrayLength(filterProperties, LIMITS.ARRAY_ELEMENTS, 'filter_properties');

      body.filter_properties = filterProperties;
    }

    return body;
  }

  /**
   * Build pagination body parameters from PaginationParameters.
   *
   * @param params - Optional pagination parameters
   * @returns Body object with pagination parameters for API requests
   *
   * @example
   * const body = this.buildPaginationBody({ page_size: 50, start_cursor: 'abc123' });
   * // body will be: { page_size: 50, start_cursor: 'abc123' }
   */
  protected buildPaginationBody(params?: PaginationParameters): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    if (params?.page_size) {
      body.page_size = params.page_size;
    }

    if (params?.start_cursor) {
      body.start_cursor = params.start_cursor;
    }

    return body;
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
}
