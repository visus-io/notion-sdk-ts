import type { NotionClient } from '../client';
import { Page, View } from '../models';
import {
  type NotionView,
  type PaginatedList,
  type PaginationParameters,
  type RequestStatus,
  viewDeleteResponseSchema,
  type ViewDeleteResult,
  viewQueryResponseSchema,
  viewSchema,
  type ViewType,
} from '../schemas';
import { NotionValidationError } from '../validation';
import { BaseAPI } from './base.api';
import type { DataSourceSort } from './dataSources.api';

/**
 * Options for listing views. Exactly one of `database_id`/`data_source_id` must be provided.
 */
export interface ListViewsOptions extends PaginationParameters {
  /** List views for this database (mutually exclusive with data_source_id) */
  database_id?: string;

  /** List views for this data source (mutually exclusive with database_id) */
  data_source_id?: string;
}

/**
 * Options for creating a view. Exactly one of `database_id`/`view_id`/`create_database`
 * must be provided to select the parent context.
 */
export interface CreateViewOptions {
  /** The data source the view displays */
  data_source_id: string;

  /** The view name */
  name: string;

  /** The view layout type */
  type: ViewType;

  /** Attach the view to this existing database */
  database_id?: string;

  /** Clone the configuration of this existing view */
  view_id?: string;

  /** Create a new database to hold the view */
  create_database?: true;

  /** Filter configuration */
  filter?: Record<string, unknown>;

  /** Sort configuration */
  sorts?: DataSourceSort[];

  /** Quick filter configuration */
  quick_filters?: Record<string, unknown>;

  /** Per-layout configuration */
  configuration?: Record<string, unknown>;

  /** Where to place the new view relative to existing views */
  position?: Record<string, unknown>;
}

/**
 * Options for updating a view. All fields optional; passing `null` for
 * filter/sorts/quick_filters clears the existing value.
 */
export interface UpdateViewOptions {
  /** Rename the view */
  name?: string;

  /** Update or clear (`null`) the filter configuration */
  filter?: Record<string, unknown> | null;

  /** Update or clear (`null`) the sort configuration */
  sorts?: DataSourceSort[] | null;

  /** Update or clear (`null`) the quick filter configuration */
  quick_filters?: Record<string, unknown> | null;

  /** Shallow-merged per-layout configuration update */
  configuration?: Record<string, unknown>;
}

/**
 * Options for creating a view query.
 */
export interface CreateViewQueryOptions extends PaginationParameters {
  /** Filter configuration */
  filter?: Record<string, unknown>;

  /** Sort configuration */
  sorts?: DataSourceSort[];
}

/**
 * Result of a view query. Non-standard pagination shape distinct from
 * {@link PaginatedList} -- includes `totalCount` and an `expiresAt` after which the
 * query can no longer be retrieved via {@link ViewsAPI.queries.get}.
 */
export interface ViewQueryResult {
  id: string;
  viewId: string;
  expiresAt: Date;
  totalCount: number;
  results: Page[];
  nextCursor: string | null;
  hasMore: boolean;
  requestStatus?: RequestStatus;
}

function toViewQueryResult(response: unknown): ViewQueryResult {
  const parsed = viewQueryResponseSchema.parse(response);

  return {
    id: parsed.id,
    viewId: parsed.view_id,
    expiresAt: new Date(parsed.expires_at),
    totalCount: parsed.total_count,
    results: parsed.results.map((page) => new Page(page)),
    nextCursor: parsed.next_cursor,
    hasMore: parsed.has_more,
    requestStatus: parsed.request_status,
  };
}

/**
 * Views API client for working with Notion views.
 *
 * Views control how a database/data source's rows are displayed (table, board,
 * calendar, etc.). Requires API version 2025-09-03 or later.
 */
export class ViewsAPI extends BaseAPI<NotionView, View> {
  protected config = {
    schema: viewSchema,
    ModelClass: View,
    listType: 'view' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * List the views for a database or data source.
   *
   * @param options - Exactly one of `database_id`/`data_source_id`, plus pagination
   * @returns Paginated list of views
   *
   * @throws {NotionValidationError} If neither or both of `database_id`/`data_source_id` are provided
   *
   * @see https://developers.notion.com/guides/data-apis/working-with-views
   */
  async list(options: ListViewsOptions): Promise<PaginatedList<View>> {
    if (Boolean(options.database_id) === Boolean(options.data_source_id)) {
      throw new NotionValidationError(
        'Exactly one of database_id or data_source_id must be provided',
      );
    }

    const query: Record<string, string> = {
      ...(options.database_id ? { database_id: options.database_id } : {}),
      ...(options.data_source_id ? { data_source_id: options.data_source_id } : {}),
      ...this.buildPaginationQuery(options),
    };

    return this.listResources('/views', query);
  }

  /**
   * Retrieve a view by ID.
   *
   * @param viewId - The ID of the view to retrieve
   * @returns The view wrapped in a View model
   *
   * @see https://developers.notion.com/guides/data-apis/working-with-views
   */
  async retrieve(viewId: string): Promise<View> {
    return this.retrieveResource(`/views/${viewId}`);
  }

  /**
   * Create a new view.
   *
   * @param options - Options for creating the view
   * @returns The created view wrapped in a View model
   *
   * @throws {NotionValidationError} If not exactly one of `database_id`/`view_id`/`create_database` is provided
   *
   * @see https://developers.notion.com/guides/data-apis/working-with-views
   */
  async create(options: CreateViewOptions): Promise<View> {
    const selectorCount = [options.database_id, options.view_id, options.create_database].filter(
      (value) => value !== undefined,
    ).length;

    if (selectorCount !== 1) {
      throw new NotionValidationError(
        'Exactly one of database_id, view_id, or create_database must be provided',
      );
    }

    return this.createResource('/views', options);
  }

  /**
   * Update a view's name, filter, sorts, quick filters, or configuration.
   *
   * @param viewId - The ID of the view to update
   * @param options - Options for updating the view
   * @returns The updated view wrapped in a View model
   *
   * @see https://developers.notion.com/guides/data-apis/working-with-views
   */
  async update(viewId: string, options: UpdateViewOptions): Promise<View> {
    return this.updateResource(`/views/${viewId}`, options);
  }

  /**
   * Delete a view.
   *
   * Note: unlike other delete methods, Notion's delete-view response only includes
   * `object`/`id`/`parent`/`type` (not the full view shape), so this returns the raw
   * parsed result rather than a full {@link View} model.
   *
   * @param viewId - The ID of the view to delete
   * @returns The partial view object returned by the API
   *
   * @see https://developers.notion.com/guides/data-apis/working-with-views
   */
  async delete(viewId: string): Promise<ViewDeleteResult> {
    const response = await this.client.request<unknown>({
      method: 'DELETE',
      path: `/views/${viewId}`,
    });

    return viewDeleteResponseSchema.parse(response);
  }

  /**
   * Sub-resource for querying a view's rows. View queries are non-standard: they
   * return a `total_count` and `expires_at`, and the query result itself expires
   * roughly 15 minutes after creation.
   */
  readonly queries = {
    /**
     * Create a new query against a view.
     *
     * @see https://developers.notion.com/guides/data-apis/working-with-views
     */
    create: async (viewId: string, options?: CreateViewQueryOptions): Promise<ViewQueryResult> => {
      const body: Record<string, unknown> = {};

      if (options?.filter) {
        body.filter = options.filter;
      }

      if (options?.sorts) {
        body.sorts = options.sorts;
      }

      Object.assign(body, this.buildPaginationBody(options));

      const response = await this.client.request<unknown>({
        method: 'POST',
        path: `/views/${viewId}/queries`,
        body: Object.keys(body).length > 0 ? body : undefined,
      });

      return toViewQueryResult(response);
    },

    /**
     * Retrieve the results of a previously created view query.
     *
     * @see https://developers.notion.com/guides/data-apis/working-with-views
     */
    get: async (viewId: string, queryId: string): Promise<ViewQueryResult> => {
      const response = await this.client.request<unknown>({
        method: 'GET',
        path: `/views/${viewId}/queries/${queryId}`,
      });

      return toViewQueryResult(response);
    },

    /**
     * Delete a view query.
     *
     * @see https://developers.notion.com/guides/data-apis/working-with-views
     */
    delete: async (viewId: string, queryId: string): Promise<void> => {
      await this.client.request<unknown>({
        method: 'DELETE',
        path: `/views/${viewId}/queries/${queryId}`,
      });
    },
  };
}
