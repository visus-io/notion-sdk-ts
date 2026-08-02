import type { NotionClient } from '../client';
import {
  dataSourceSchema,
  type DataSourceTemplateList,
  dataSourceTemplateListSchema,
  type NotionDataSource,
  type NotionPage,
  pageSchema,
  type PaginatedList,
  paginatedListSchema,
  type PaginationParameters,
} from '../schemas';
import { DataSource, Page } from '../models';
import { LIMITS, validateArrayLength } from '../validation';
import { BaseAPI } from './base.api';

/**
 * Parent for creating a data source.
 */
export type CreateDataSourceParent = { database_id: string };

/**
 * Options for creating a data source.
 */
export interface CreateDataSourceOptions {
  /** The parent database object */
  parent: CreateDataSourceParent;

  /** Data source properties schema */
  properties: Record<string, unknown>;

  /** Data source title as rich text array */
  title?: unknown[];

  /** Data source icon (emoji, file, or external) */
  icon?: unknown;
}

/**
 * Options for updating a data source.
 */
export interface UpdateDataSourceOptions {
  /** Update the data source title */
  title?: unknown[];

  /** Update the data source icon */
  icon?: unknown;

  /** Update the data source properties schema */
  properties?: Record<string, unknown>;

  /** Move to trash or restore from trash */
  in_trash?: boolean;

  /** Move the data source to a different database */
  parent?: CreateDataSourceParent;
}

/**
 * Options for retrieving a data source.
 */
export interface RetrieveDataSourceOptions {
  /** Filter properties to include in the response */
  filter_properties?: string[];
}

/**
 * Options for listing a data source's templates.
 */
export interface ListDataSourceTemplatesOptions extends PaginationParameters {
  /** Filter templates by name (case-insensitive substring match) */
  name?: string;
}

/**
 * Filter condition for data source queries.
 * This type is simplified. The Notion API supports many more filter types.
 * See: https://developers.notion.com/reference/filter-data-source-entries
 */
export type DataSourceFilter = Record<string, unknown>;

/**
 * Sort direction for data source queries.
 */
export type SortDirection = 'ascending' | 'descending';

/**
 * Sort configuration for data source queries.
 */
export type DataSourceSort =
  | {
      /** Sort by a property */
      property: string;
      direction: SortDirection;
    }
  | {
      /** Sort by timestamp */
      timestamp: 'created_time' | 'last_edited_time';
      direction: SortDirection;
    };

/**
 * Options for querying a data source.
 */
export interface QueryDataSourceOptions extends PaginationParameters {
  /** Filter configuration */
  filter?: DataSourceFilter;

  /** Array of sort configurations */
  sorts?: DataSourceSort[];

  /** Filter properties to include in results */
  filter_properties?: string[];

  /** Filter by result type (for wikis) */
  result_type?: 'page' | 'data_source';

  /** Whether to return only archived pages (true) or only non-archived pages (false, default) */
  is_archived?: boolean;

  /**
   * Whether to return only trashed pages (true) or only non-trashed pages (false).
   *
   * @deprecated Use `is_archived` instead. This field is an alias that forwards
   * into `is_archived`. If you provide both fields, `is_archived` takes precedence.
   */
  in_trash?: boolean;
}

/**
 * Data Sources API client for working with Notion data sources.
 *
 * Data sources are individual tables of data that live under a Notion database.
 * As of API version 2025-09-03, data sources have their own API endpoints.
 *
 * @category Databases & Data Sources
 */
export class DataSourcesAPI extends BaseAPI<NotionDataSource, DataSource> {
  protected config = {
    schema: dataSourceSchema,
    ModelClass: DataSource,
    listType: 'data_source' as const,
  };
  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Retrieve a data source by ID.
   *
   * @param dataSourceId - The ID of the data source to retrieve (with or without dashes)
   * @param options - Options for filtering properties
   * @returns The data source wrapped in a DataSource model
   *
   * @see https://developers.notion.com/reference/retrieve-a-data-source
   */
  async retrieve(dataSourceId: string, options?: RetrieveDataSourceOptions): Promise<DataSource> {
    const query: Record<string, string | string[]> = {
      ...this.buildFilterPropertiesQuery(options?.filter_properties),
    };

    return this.retrieveResource(`/data_sources/${dataSourceId}`, query);
  }

  /**
   * List the templates available for a data source.
   *
   * @param dataSourceId - The ID of the data source
   * @param options - Options for filtering by name and paginating results
   * @returns The list of templates, along with pagination metadata
   *
   * @see https://developers.notion.com/reference/list-data-source-templates
   */
  async listTemplates(
    dataSourceId: string,
    options?: ListDataSourceTemplatesOptions,
  ): Promise<DataSourceTemplateList> {
    const query: Record<string, string> = {
      ...(options?.name ? { name: options.name } : {}),
      ...this.buildPaginationQuery(options),
    };

    const response = await this.client.request<unknown>({
      method: 'GET',
      path: `/data_sources/${dataSourceId}/templates`,
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    return dataSourceTemplateListSchema.parse(response);
  }

  /**
   * Query a data source with optional filters and sorts.
   * Returns pages that match the query.
   *
   * @param dataSourceId - The ID of the data source to query
   * @param options - Query options (filter, sorts, pagination)
   * @returns Paginated list of pages from the data source
   *
   * @see https://developers.notion.com/reference/query-a-data-source
   */
  // eslint-disable-next-line complexity
  async query(
    dataSourceId: string,
    options?: QueryDataSourceOptions,
  ): Promise<PaginatedList<Page>> {
    const body: Record<string, unknown> = {};

    if (options?.filter) {
      body.filter = options.filter;
    }

    if (options?.sorts) {
      body.sorts = options.sorts;
    }

    if (options?.page_size) {
      body.page_size = options.page_size;
    }

    if (options?.start_cursor) {
      body.start_cursor = options.start_cursor;
    }

    if (options?.in_trash !== undefined && options?.is_archived === undefined) {
      console.warn(
        '[notion-sdk-ts] QueryDataSourceOptions.in_trash is deprecated, use is_archived instead.',
      );
    }

    const isArchived = options?.is_archived ?? options?.in_trash;

    if (isArchived !== undefined) {
      body.is_archived = isArchived;
    }

    if (options?.result_type) {
      body.result_type = options.result_type;
    }

    const query = this.buildFilterPropertiesQuery(options?.filter_properties);

    const response = await this.client.request<PaginatedList<NotionPage>>({
      method: 'POST',
      path: `/data_sources/${dataSourceId}/query`,
      query: Object.keys(query).length > 0 ? query : undefined,
      body: Object.keys(body).length > 0 ? body : undefined,
    });

    const listSchema = paginatedListSchema(pageSchema);
    const parsed = listSchema.parse(response);

    return {
      object: 'list',
      results: parsed.results.map((page) => new Page(page)),
      next_cursor: parsed.next_cursor,
      has_more: parsed.has_more,
      type: 'page',
      request_status: parsed.request_status,
    };
  }

  /**
   * Create a new data source under a database.
   *
   * @param options - Options for creating the data source
   * @returns The created data source wrapped in a DataSource model
   *
   * @see https://developers.notion.com/reference/create-a-data-source
   */
  async create(options: CreateDataSourceOptions): Promise<DataSource> {
    if (options.title) {
      validateArrayLength(options.title, LIMITS.ARRAY_ELEMENTS, 'title');
    }

    return this.createResource('/data_sources', options);
  }

  /**
   * Update a data source's properties, title, icon, or status.
   *
   * @param dataSourceId - The ID of the data source to update
   * @param options - Options for updating the data source
   * @returns The updated data source wrapped in a DataSource model
   *
   * @see https://developers.notion.com/reference/update-a-data-source
   */
  async update(dataSourceId: string, options: UpdateDataSourceOptions): Promise<DataSource> {
    if (options.title) {
      validateArrayLength(options.title, LIMITS.ARRAY_ELEMENTS, 'title');
    }

    return this.updateResource(`/data_sources/${dataSourceId}`, options);
  }

  /**
   * Move a data source to trash (convenience method).
   *
   * @param dataSourceId - The ID of the data source to trash
   * @returns The trashed data source wrapped in a DataSource model
   */
  async trash(dataSourceId: string): Promise<DataSource> {
    return this.update(dataSourceId, { in_trash: true });
  }

  /**
   * Restore a data source from trash (convenience method).
   *
   * @param dataSourceId - The ID of the data source to restore from trash
   * @returns The restored data source wrapped in a DataSource model
   */
  async untrash(dataSourceId: string): Promise<DataSource> {
    return this.update(dataSourceId, { in_trash: false });
  }

  /**
   * Move a data source to trash.
   *
   * @deprecated Use {@link trash} instead.
   * @param dataSourceId - The ID of the data source to trash
   * @returns The trashed data source wrapped in a DataSource model
   */
  async archive(dataSourceId: string): Promise<DataSource> {
    return this.trash(dataSourceId);
  }

  /**
   * Restore a trashed data source.
   *
   * @deprecated Use {@link untrash} instead.
   * @param dataSourceId - The ID of the data source to restore
   * @returns The restored data source wrapped in a DataSource model
   */
  async restore(dataSourceId: string): Promise<DataSource> {
    return this.untrash(dataSourceId);
  }
}
