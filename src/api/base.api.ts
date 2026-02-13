import type { NotionClient } from '../client';
import type { PaginatedList, PaginatedListType, PaginationParameters } from '../schemas';
import { paginatedListSchema } from '../schemas';
import { LIMITS, validateArrayLength } from '../validation';
import type { z } from 'zod';

/**
 * Base API class providing common functionality for all Notion API clients.
 */
export abstract class BaseAPI {
  protected constructor(protected readonly client: NotionClient) {}

  /**
   * Delete a resource via DELETE request.
   *
   * @param resourcePath - Path to the specific resource (e.g., '/pages/{page_id}', '/databases/{database_id}')
   * @param schema - Zod schema to validate the response
   * @param ModelClass - Model class constructor
   * @returns Instance of the model class representing the deleted resource
   *
   * @example
   * return this.deleteResource<NotionPage, Page>(
   *   `/pages/${pageId}`,
   *   pageSchema,
   *   Page,
   * );
   */
  protected async deleteResource<TResponse, TModel>(
    resourcePath: string,
    schema: z.ZodSchema<TResponse>,
    ModelClass: new (data: TResponse) => TModel,
  ): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'DELETE',
      path: resourcePath,
    });

    return this.parseAndWrap(response, schema, ModelClass);
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
   * @param schema - Zod schema to validate the response
   * @param ModelClass - Model class constructor
   * @returns Instance of the model class representing the created resource
   *
   * @example
   * return this.createResource<NotionPage, Page>(
   *   '/pages',
   *   { parent: { database_id: '...' }, properties: { ... } },
   *   pageSchema,
   *   Page,
   * );
   */
  protected async createResource<TResponse, TModel>(
    resourcePath: string,
    body: unknown,
    schema: z.ZodSchema<TResponse>,
    ModelClass: new (data: TResponse) => TModel,
  ): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'POST',
      path: resourcePath,
      body,
    });

    return this.parseAndWrap(response, schema, ModelClass);
  }

  /**
   * Retrieve a resource via GET request.
   *
   * @param resourcePath - Path to the specific resource (e.g., '/pages/{page_id}', '/databases/{database_id}')
   * @param schema - Zod schema to validate the response
   * @param ModelClass - Model class constructor
   * @param query - Optional query parameters for the GET request
   * @returns Instance of the model class representing the retrieved resource
   *
   * @example
   * return this.retrieveResource<NotionPage, Page>(
   *   `/pages/${pageId}`,
   *   pageSchema,
   *   Page,
   *   query
   * );
   */
  protected async retrieveResource<TResponse, TModel>(
    resourcePath: string,
    schema: z.ZodSchema<TResponse>,
    ModelClass: new (data: TResponse) => TModel,
    query?: Record<string, string>,
  ): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'GET',
      path: resourcePath,
      query: Object.keys(query || {}).length > 0 ? query : undefined,
    });

    return this.parseAndWrap(response, schema, ModelClass);
  }

  /**
   * Retrieve a paginated list of resources via GET request.
   *
   * @param resourcePath - Path to the resource collection (e.g., '/pages', '/databases')
   * @param itemSchema - Zod schema to validate each item in the results array
   * @param ModelClass - Model class constructor for each item in the results array
   * @param type - The type of items in the paginated list (used for typing the results)
   * @param query - Optional query parameters for pagination and filtering
   * @returns PaginatedList containing instances of the model class for each item in the results array
   *
   * @example
   * return this.listResources<NotionPage, Page>(
   *   '/pages',
   *   pageSchema,
   *   Page,
   *   'page',
   *   { page_size: '50' },
   * );
   */
  protected async listResources<TResponse, TModel>(
    resourcePath: string,
    itemSchema: z.ZodSchema<TResponse>,
    ModelClass: new (data: TResponse) => TModel,
    type: PaginatedListType,
    query?: Record<string, string>,
  ): Promise<PaginatedList<TModel>> {
    const response = await this.client.request<PaginatedList<TResponse>>({
      method: 'GET',
      path: resourcePath,
      query: Object.keys(query || {}).length > 0 ? query : undefined,
    });

    return this.parsePaginatedList(response, itemSchema, ModelClass, type);
  }

  /**
   * Parse response data using the provided schema and wrap it in the specified model class.
   *
   * @param response - The raw response data to parse
   * @param schema - Zod schema to validate the response
   * @param ModelClass - Model class constructor
   * @returns Instance of the model class representing the parsed resource
   *
   * @example
   * const response = await this.client.request<NotionPage>({ ... });
   * return this.parseAndWrap(response, pageSchema, Page);
   */
  protected parseAndWrap<TResponse, TModel>(
    response: TResponse,
    schema: z.ZodSchema<TResponse>,
    ModelClass: new (data: TResponse) => TModel,
  ): TModel {
    const parsed = schema.parse(response);
    return new ModelClass(parsed);
  }

  /**
   * Parse a paginated list response and wrap each item in the specified model class.
   *
   * @param response - The raw paginated list response to parse
   * @param itemSchema - Zod schema to validate each item in the results array
   * @param ModelClass - Model class constructor for each item in the results array
   * @param type - The type of items in the paginated list (used for typing the results)
   * @returns PaginatedList containing instances of the model class for each item in the results array
   *
   * @example
   * const response = await this.client.request<PaginatedList<NotionPage>>({ ... });
   * return this.parsePaginatedList(response, pageSchema, Page, 'page');
   */
  protected parsePaginatedList<TResponse, TModel>(
    response: PaginatedList<TResponse>,
    itemSchema: z.ZodSchema<TResponse>,
    ModelClass: new (data: TResponse) => TModel,
    type: PaginatedListType,
  ): PaginatedList<TModel> {
    const listSchema = paginatedListSchema(itemSchema);
    const parsed = listSchema.parse(response);

    return {
      object: 'list',
      results: parsed.results.map((item) => new ModelClass(item)),
      next_cursor: parsed.next_cursor,
      has_more: parsed.has_more,
      type,
    };
  }

  /**
   * Update an existing resource via PATCH request.
   *
   * @param resourcePath - Path to the specific resource (e.g., '/pages/{page_id}', '/databases/{database_id}')
   * @param body - Request body with updated fields
   * @param schema - Zod schema to validate the response
   * @param ModelClass - Model class constructor
   * @returns Instance of the model class representing the updated resource
   *
   * @example
   * return this.updateResource<NotionPage, Page>(
   *   `/pages/${pageId}`,
   *   { properties: { ... } },
   *   pageSchema,
   *   Page,
   * );
   */
  protected async updateResource<TResponse, TModel>(
    resourcePath: string,
    body: unknown,
    schema: z.ZodSchema<TResponse>,
    ModelClass: new (data: TResponse) => TModel,
  ): Promise<TModel> {
    const response = await this.client.request<TResponse>({
      method: 'PATCH',
      path: resourcePath,
      body,
    });

    return this.parseAndWrap(response, schema, ModelClass);
  }
}
