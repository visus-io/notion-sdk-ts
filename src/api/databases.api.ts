import type { NotionClient } from '../client';
import {
  databaseSchema,
  type DatabaseType,
  type NotionDatabase,
  type NotionPage,
  pageSchema,
  type PaginatedList,
  paginatedListSchema,
  type PaginationParameters,
} from '../schemas';
import { Database, Page } from '../models';
import { TRUSTED } from '../models/base.model';
import { LIMITS, NotionValidationError, validateArrayLength } from '../validation';
import { BaseAPI } from './base.api';

/**
 * Options for retrieving a database.
 */
export interface RetrieveDatabaseOptions {
  /** Filter properties to include in the response */
  filter_properties?: string[];
}

/**
 * Filter condition for database queries.
 * This type is simplified. The Notion API supports many more filter types.
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
 * Provide this to create a database with a custom properties schema. To create a database
 * from one of Notion's canonical schemas instead, use `database_type` on
 * {@link CreateDatabaseOptions}.
 */
export interface InitialDataSource {
  /** Data source properties schema */
  properties: Record<string, unknown>;

  /** Data source title as rich text array */
  title?: unknown[];
}

/**
 * Options for creating a database.
 * Provide exactly one of `database_type` or `initial_data_source`. `database_type` builds
 * the database from one of Notion's canonical schemas. `initial_data_source` holds a custom
 * properties schema. It replaces top-level properties.
 */
export interface CreateDatabaseOptions {
  /** The parent object (page or workspace) */
  parent: CreateDatabaseParent;

  /** Build the database from a canonical Notion schema instead of a custom one */
  database_type?: DatabaseType;

  /** Initial data source configuration (contains properties schema) */
  initial_data_source?: InitialDataSource;

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
 * As of API version 2025-09-03, manage properties at the data source level.
 * Use DataSourcesAPI to update properties.
 */
export interface UpdateDatabaseOptions {
  /** Update the database title */
  title?: unknown[];

  /** Update the database icon */
  icon?: unknown;

  /** Update the database cover */
  cover?: unknown;

  /** Move to trash or restore from trash */
  in_trash?: boolean;

  /** Lock or unlock the database from editing */
  is_locked?: boolean;

  /** Whether the database is inline */
  is_inline?: boolean;

  /** Move the database to a different parent */
  parent?: CreateDatabaseParent;
}

/**
 * Databases API client for working with Notion databases.
 *
 * @category Databases & Data Sources
 */
export class DatabasesAPI extends BaseAPI<NotionDatabase, Database> {
  protected config = {
    schema: databaseSchema,
    ModelClass: Database,
    listType: 'database' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

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
    const query: Record<string, string | string[]> = {
      ...this.buildFilterPropertiesQuery(options?.filter_properties),
    };

    return this.retrieveResource(`/databases/${databaseId}`, query);
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
    const body: Record<string, unknown> = {
      ...(options?.filter ? { filter: options.filter } : {}),
      ...(options?.sorts ? { sorts: options.sorts } : {}),
      ...this.buildPaginationBody(options),
    };

    const query = this.buildFilterPropertiesQuery(options?.filter_properties);

    const response = await this.client.request<PaginatedList<NotionPage>>({
      method: 'POST',
      path: `/databases/${databaseId}/query`,
      query: Object.keys(query).length > 0 ? query : undefined,
      body: Object.keys(body).length > 0 ? body : undefined,
    });

    const listSchema = paginatedListSchema(pageSchema);
    const parsed = listSchema.parse(response);

    return {
      object: 'list',
      results: parsed.results.map((page) => new Page(page, TRUSTED)),
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
   * @throws {NotionValidationError} If not exactly one of `database_type`/`initial_data_source` is provided
   *
   * @see https://developers.notion.com/reference/create-a-database
   */
  async create(options: CreateDatabaseOptions): Promise<Database> {
    if (Boolean(options.database_type) === Boolean(options.initial_data_source)) {
      throw new NotionValidationError(
        'Exactly one of database_type or initial_data_source must be provided',
      );
    }
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

    return this.createResource('/databases', options);
  }

  /**
   * Update a database's properties, title, description, or trash status.
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

    return this.updateResource(`/databases/${databaseId}`, options);
  }

  /**
   * Move a database to trash (convenience method).
   *
   * @param databaseId - The ID of the database to trash
   * @returns The trashed database wrapped in a Database model
   */
  async trash(databaseId: string): Promise<Database> {
    return this.update(databaseId, { in_trash: true });
  }

  /**
   * Restore a trashed database (convenience method).
   *
   * @param databaseId - The ID of the database to restore
   * @returns The restored database wrapped in a Database model
   */
  async restore(databaseId: string): Promise<Database> {
    return this.update(databaseId, { in_trash: false });
  }

  /**
   * Move a database to trash (convenience method).
   *
   * @deprecated Use {@link trash} instead.
   * @param databaseId - The ID of the database to trash
   * @returns The trashed database wrapped in a Database model
   */
  async archive(databaseId: string): Promise<Database> {
    return this.trash(databaseId);
  }
}
