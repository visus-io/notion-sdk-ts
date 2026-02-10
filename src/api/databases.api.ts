import type { NotionClient } from '../client';
import {
  databaseSchema,
  type NotionDatabase,
  type NotionPage,
  pageSchema,
  type PaginatedList,
  paginatedListSchema,
  type PaginationParameters,
} from '../schemas';
import { Database, Page } from '../models';
import { LIMITS, validateArrayLength } from '../validation';

/**
 * Options for retrieving a database.
 */
export interface RetrieveDatabaseOptions {
  /** Filter properties to include in the response */
  filter_properties?: string[];
}

/**
 * Filter condition for database queries.
 * This is a simplified type - the actual Notion API supports many filter types.
 * See: https://developers.notion.com/reference/post-database-query-filter
 */
export type DatabaseFilter = Record<string, unknown>;

/**
 * Sort direction for database queries.
 */
export type SortDirection = 'ascending' | 'descending';

/**
 * Sort configuration for database queries.
 */
export type DatabaseSort =
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
 * Options for querying a database.
 */
export interface QueryDatabaseOptions extends PaginationParameters {
  /** Filter configuration */
  filter?: DatabaseFilter;

  /** Array of sort configurations */
  sorts?: DatabaseSort[];

  /** Filter properties to include in results */
  filter_properties?: string[];
}

/**
 * Parent for creating a database.
 */
export type CreateDatabaseParent = { page_id: string } | { workspace: true };

/**
 * Initial data source configuration for creating a database.
 * In API version 2025-09-03, databases are created with an initial data source.
 */
export interface InitialDataSource {
  /** Data source properties schema */
  properties: Record<string, unknown>;

  /** Data source title as rich text array */
  title?: unknown[];
}

/**
 * Options for creating a database.
 * As of API version 2025-09-03, databases are created with an initial_data_source
 * containing the properties schema, rather than properties at the top level.
 */
export interface CreateDatabaseOptions {
  /** The parent object (page or workspace) */
  parent: CreateDatabaseParent;

  /** Initial data source configuration (contains properties schema) */
  initial_data_source: InitialDataSource;

  /** Database title as rich text array */
  title?: unknown[];

  /** Database icon (emoji, file, or external) */
  icon?: unknown;

  /** Database cover image */
  cover?: unknown;

  /** Whether the database is inline */
  is_inline?: boolean;
}

/**
 * Options for updating a database.
 * As of API version 2025-09-03, properties are managed at the data source level.
 * Use the DataSourcesAPI to update properties.
 */
export interface UpdateDatabaseOptions {
  /** Update the database title */
  title?: unknown[];

  /** Update the database icon */
  icon?: unknown;

  /** Update the database cover */
  cover?: unknown;

  /** Archive or restore the database */
  archived?: boolean;

  /** Move to trash or restore from trash */
  in_trash?: boolean;

  /** Whether the database is inline */
  is_inline?: boolean;

  /** Move the database to a different parent */
  parent?: CreateDatabaseParent;
}

/**
 * Databases API client for working with Notion databases.
 */
export class DatabasesAPI {
  constructor(private readonly client: NotionClient) {}

  /**
   * Retrieve a database by ID.
   *
   * @param databaseId - The ID of the database to retrieve (with or without dashes)
   * @param options - Options for filtering properties
   * @returns The database wrapped in a Database model
   *
   * @see https://developers.notion.com/reference/retrieve-a-database
   */
  async retrieve(databaseId: string, options?: RetrieveDatabaseOptions): Promise<Database> {
    const query: Record<string, string> = {};

    if (options?.filter_properties) {
      validateArrayLength(options.filter_properties, LIMITS.ARRAY_ELEMENTS, 'filter_properties');
      query.filter_properties = options.filter_properties.join(',');
    }

    const response = await this.client.request<NotionDatabase>({
      method: 'GET',
      path: `/databases/${databaseId}`,
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    const parsed = databaseSchema.parse(response);
    return new Database(parsed);
  }

  /**
   * Query a database with optional filters and sorts.
   * Returns pages that match the query.
   *
   * @param databaseId - The ID of the database to query
   * @param options - Query options (filter, sorts, pagination)
   * @returns Paginated list of pages from the database
   *
   * @see https://developers.notion.com/reference/post-database-query
   */
  async query(databaseId: string, options?: QueryDatabaseOptions): Promise<PaginatedList<Page>> {
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

    const response = await this.client.request<PaginatedList<NotionPage>>({
      method: 'POST',
      path: `/databases/${databaseId}/query`,
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
   * Create a new database.
   *
   * @param options - Options for creating the database
   * @returns The created database wrapped in a Database model
   *
   * @see https://developers.notion.com/reference/create-a-database
   */
  async create(options: CreateDatabaseOptions): Promise<Database> {
    if (options.title) {
      validateArrayLength(options.title, LIMITS.ARRAY_ELEMENTS, 'title');
    }
    if (options.initial_data_source?.title) {
      validateArrayLength(
        options.initial_data_source.title,
        LIMITS.ARRAY_ELEMENTS,
        'initial_data_source.title',
      );
    }
    if (options.initial_data_source.title) {
      validateArrayLength(
        options.initial_data_source.title,
        LIMITS.ARRAY_ELEMENTS,
        'initial_data_source.title',
      );
    }

    const response = await this.client.request<NotionDatabase>({
      method: 'POST',
      path: '/databases',
      body: options,
    });

    const parsed = databaseSchema.parse(response);
    return new Database(parsed);
  }

  /**
   * Update a database's properties, title, description, or archived status.
   *
   * @param databaseId - The ID of the database to update
   * @param options - Options for updating the database
   * @returns The updated database wrapped in a Database model
   *
   * @see https://developers.notion.com/reference/update-a-database
   */
  async update(databaseId: string, options: UpdateDatabaseOptions): Promise<Database> {
    if (options.title) {
      validateArrayLength(options.title, LIMITS.ARRAY_ELEMENTS, 'title');
    }

    const response = await this.client.request<NotionDatabase>({
      method: 'PATCH',
      path: `/databases/${databaseId}`,
      body: options,
    });

    const parsed = databaseSchema.parse(response);
    return new Database(parsed);
  }

  /**
   * Archive a database (convenience method).
   *
   * @param databaseId - The ID of the database to archive
   * @returns The archived database wrapped in a Database model
   */
  async archive(databaseId: string): Promise<Database> {
    return this.update(databaseId, { archived: true });
  }

  /**
   * Restore an archived database (convenience method).
   *
   * @param databaseId - The ID of the database to restore
   * @returns The restored database wrapped in a Database model
   */
  async restore(databaseId: string): Promise<Database> {
    return this.update(databaseId, { archived: false });
  }
}
