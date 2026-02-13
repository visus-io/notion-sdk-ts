import type { NotionClient } from '../client';
import type { PaginatedList, PaginatedListType, PaginationParameters } from '../schemas';
import { paginatedListSchema } from '../schemas';
import { LIMITS, validateArrayLength } from '../validation';
import type { z } from 'zod';

/**
 * Configuration for API resource operations, including paths, schemas, and model classes.
 *
 * @template TResponse - The raw response type from the API
 * @template TModel - The model class type that wraps the response
 */
interface ResourceConfig<TResponse, TModel> {
  /** Zod schema to validate the API response */
  schema: z.ZodSchema<TResponse>;

  /** Model class constructor to wrap the validated response */
  ModelClass: new (data: TResponse) => TModel;

  /** Type of items in the paginated list (used for typing the results) */
  listType?: PaginatedListType;
}

/**
 * Base API class providing common functionality for all Notion API clients.
 *
 * @template TResponse - The raw response type from the API
 * @template TModel - The model class type that wraps the response
 */
export abstract class BaseAPI<TResponse, TModel> {
  protected abstract config: ResourceConfig<TResponse, TModel>;

  protected constructor(protected readonly client: NotionClient) {}

  /**
   * Delete a resource via DELETE request.
   *
   * @param resourcePath - Path to the specific resource (e.g., '/pages/{page_id}', '/databases/{database_id}')
   * @returns Instance of the model class representing the deleted resource
   *
   * @example
   * return this.deleteResource(`/pages/${pageId}`);
   */
  protected async deleteResource(resourcePath: string): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'DELETE',
      path: resourcePath,
    });

    return this.parseAndWrap(response);
  }

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

  /**
   * Create a new resource via POST request.
   *
   * @param resourcePath - Path to the resource collection (e.g., '/pages', '/databases')
   * @param body - Request body to send
   * @returns Instance of the model class representing the created resource
   *
   * @example
   * return this.createResource(
   *   '/pages',
   *   { parent: { ... }, properties: { ... } },
   * );
   */
  protected async createResource(resourcePath: string, body: unknown): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'POST',
      path: resourcePath,
      body,
    });

    return this.parseAndWrap(response);
  }

  /**
   * Retrieve a resource via GET request.
   *
   * @param resourcePath - Path to the specific resource (e.g., '/pages/{page_id}', '/databases/{database_id}')
   * @param query - Optional query parameters for the GET request
   * @returns Instance of the model class representing the retrieved resource
   *
   * @example
   * return this.retrieveResource(`/pages/${pageId}`, query);
   */
  protected async retrieveResource(
    resourcePath: string,
    query?: Record<string, string>,
  ): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'GET',
      path: resourcePath,
      query: Object.keys(query || {}).length > 0 ? query : undefined,
    });

    return this.parseAndWrap(response);
  }

  /**
   * Retrieve a paginated list of resources via GET request.
   *
   * @param resourcePath - Path to the resource collection (e.g., '/pages', '/databases')
   * @param query - Optional query parameters for pagination and filtering
   * @returns PaginatedList containing instances of the model class for each item in the results array
   *
   * @example
   * return this.listResources(
   *   '/pages',
   *   { page_size: '50' },
   * );
   */
  protected async listResources(
    resourcePath: string,
    query?: Record<string, string>,
  ): Promise<PaginatedList<TModel>> {
    const response = await this.client.request<PaginatedList<TResponse>>({
      method: 'GET',
      path: resourcePath,
      query: Object.keys(query || {}).length > 0 ? query : undefined,
    });

    return this.parsePaginatedList(response);
  }

  /**
   * Update an existing resource via PATCH request.
   *
   * @param resourcePath - Path to the specific resource (e.g., '/pages/{page_id}', '/databases/{database_id}')
   * @param body - Request body with updated fields
   * @returns Instance of the model class representing the updated resource
   *
   * @example
   * return this.updateResource(
   *   `/pages/${pageId}`,
   *   { properties: { ... } },
   * );
   */
  protected async updateResource(resourcePath: string, body: unknown): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'PATCH',
      path: resourcePath,
      body,
    });

    return this.parseAndWrap(response);
  }

  /**
   * Parse response data using the provided schema and wrap it in the specified model class.
   *
   * @param response - The raw response data to parse
   * @returns Instance of the model class representing the parsed resource
   *
   * @example
   * const response = await this.client.request<NotionPage>({ ... });
   * return this.parseAndWrap(response);
   */
  private parseAndWrap(response: TResponse): TModel {
    const parsed = this.config.schema.parse(response);
    return new this.config.ModelClass(parsed);
  }

  /**
   * Parse a paginated list response and wrap each item in the specified model class.
   *
   * @param response - The raw paginated list response to parse
   * @returns PaginatedList containing instances of the model class for each item in the results array
   *
   * @example
   * const response = await this.client.request<PaginatedList<NotionPage>>({ ... });
   * return this.parsePaginatedList(response);
   */
  private parsePaginatedList(response: PaginatedList<TResponse>): PaginatedList<TModel> {
    const schema = paginatedListSchema(this.config.schema);
    const parsed = schema.parse(response);

    return {
      object: 'list',
      results: parsed.results.map((item) => new this.config.ModelClass(item)),
      next_cursor: parsed.next_cursor,
      has_more: parsed.has_more,
      type: this.config.listType || ('unknown' as PaginatedListType),
    };
  }
}
