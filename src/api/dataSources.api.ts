import type { NotionClient } from '../client';
import {
  dataSourceSchema,
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

  /** Archive or restore the data source */
  archived?: boolean;

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
 * Filter condition for data source queries.
 * This is a simplified type - the actual Notion API supports many filter types.
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

  /** Filter by archived status */
  archived?: boolean;

  /** Filter by trash status */
  in_trash?: boolean;

  /** Filter by result type (for wikis) */
  result_type?: 'page' | 'data_source';
}

/**
 * Data Sources API client for working with Notion data sources.
 *
 * Data sources are individual tables of data that live under a Notion database.
 * As of API version 2025-09-03, data sources have their own API endpoints.
 */
export class DataSourcesAPI extends BaseAPI {
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
    const query: Record<string, string> = {};

    if (options?.filter_properties) {
      validateArrayLength(options.filter_properties, LIMITS.ARRAY_ELEMENTS, 'filter_properties');
      query.filter_properties = options.filter_properties.join(',');
    }

    const response = await this.client.request<NotionDataSource>({
      method: 'GET',
      path: `/data_sources/${dataSourceId}`,
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    const parsed = dataSourceSchema.parse(response);
    return new DataSource(parsed);
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

    if (options?.filter_properties) {
      validateArrayLength(options.filter_properties, LIMITS.ARRAY_ELEMENTS, 'filter_properties');
      body.filter_properties = options.filter_properties;
    }

    if (options?.archived !== undefined) {
      body.archived = options.archived;
    }

    if (options?.in_trash !== undefined) {
      body.in_trash = options.in_trash;
    }

    if (options?.result_type) {
      body.result_type = options.result_type;
    }

    const response = await this.client.request<PaginatedList<NotionPage>>({
      method: 'POST',
      path: `/data_sources/${dataSourceId}/query`,
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

    const response = await this.client.request<NotionDataSource>({
      method: 'POST',
      path: '/data_sources',
      body: options,
    });

    const parsed = dataSourceSchema.parse(response);
    return new DataSource(parsed);
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

    const response = await this.client.request<NotionDataSource>({
      method: 'PATCH',
      path: `/data_sources/${dataSourceId}`,
      body: options,
    });

    const parsed = dataSourceSchema.parse(response);
    return new DataSource(parsed);
  }

  /**
   * Archive a data source (convenience method).
   *
   * @param dataSourceId - The ID of the data source to archive
   * @returns The archived data source wrapped in a DataSource model
   */
  async archive(dataSourceId: string): Promise<DataSource> {
    return this.update(dataSourceId, { archived: true });
  }

  /**
   * Restore an archived data source (convenience method).
   *
   * @param dataSourceId - The ID of the data source to restore
   * @returns The restored data source wrapped in a DataSource model
   */
  async restore(dataSourceId: string): Promise<DataSource> {
    return this.update(dataSourceId, { archived: false });
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
}
