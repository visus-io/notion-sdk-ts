import type { NotionClient } from '../client';
import type { NotionPage } from '../schemas';
import { pageSchema } from '../schemas';
import { Page } from '../models';
import { LIMITS, validateArrayLength } from '../validation';
import { BaseAPI } from './base.api';

/**
 * Options for retrieving a page.
 */
export interface RetrievePageOptions {
  /** Filter properties to include in the response (max 100) */
  filter_properties?: string[];
}

/**
 * Parent for creating a page.
 */
export type CreatePageParent =
  | { page_id: string }
  | { database_id: string }
  | { data_source_id: string }
  | { workspace: true };

/**
 * Options for creating a page.
 */
export interface CreatePageOptions {
  /** The parent object (page, database, data source, or workspace) */
  parent: CreatePageParent;

  /** Page properties (title required for page parent, schema must match for database parent) */
  properties?: Record<string, unknown>;

  /** Page icon (emoji, file, or external) */
  icon?: unknown;

  /** Page cover image */
  cover?: unknown;

  /** Page content blocks (max 100) */
  children?: unknown[];

  /** Template to apply when creating the page */
  template?: { type: 'none' } | { type: 'default' } | { type: 'template_id'; template_id: string };

  /** Position of the new page */
  position?:
    | { type: 'after_block'; after_block: { id: string } }
    | { type: 'page_start' }
    | { type: 'page_end' };
}

/**
 * Options for updating a page.
 */
export interface UpdatePageOptions {
  /** Page properties to update */
  properties?: Record<string, unknown>;

  /** Update the page icon */
  icon?: unknown;

  /** Update the page cover */
  cover?: unknown;

  /** Lock or unlock the page from editing */
  is_locked?: boolean;

  /** Archive or restore the page */
  archived?: boolean;

  /** Move to trash or restore from trash */
  in_trash?: boolean;

  /** Template to apply to the page */
  template?: { type: 'default' } | { type: 'template_id'; template_id: string };

  /** Erase all existing content from the page */
  erase_content?: boolean;
}

/**
 * Pages API client for working with Notion pages.
 */
export class PagesAPI extends BaseAPI<NotionPage, Page> {
  protected config = {
    schema: pageSchema,
    ModelClass: Page,
    listType: 'page' as const,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

  /**
   * Retrieve a page by ID.
   *
   * @param pageId - The ID of the page to retrieve (with or without dashes)
   * @param options - Options for filtering properties
   * @returns The page wrapped in a Page model
   *
   * @see https://developers.notion.com/reference/retrieve-a-page
   */
  async retrieve(pageId: string, options?: RetrievePageOptions): Promise<Page> {
    const query: Record<string, string> = {
      ...this.buildFilterPropertiesQuery(options?.filter_properties),
    };

    return this.retrieveResource(`/pages/${pageId}`, query);
  }

  /**
   * Create a new page.
   *
   * @param options - Options for creating the page
   * @returns The created page wrapped in a Page model
   *
   * @see https://developers.notion.com/reference/post-page
   */
  async create(options: CreatePageOptions): Promise<Page> {
    if (options.children) {
      validateArrayLength(options.children, LIMITS.ARRAY_ELEMENTS, 'children');
    }

    return this.createResource('/pages', options);
  }

  /**
   * Update a page's properties, icon, cover, or archived status.
   *
   * @param pageId - The ID of the page to update
   * @param options - Options for updating the page
   * @returns The updated page wrapped in a Page model
   *
   * @see https://developers.notion.com/reference/patch-page
   */
  async update(pageId: string, options: UpdatePageOptions): Promise<Page> {
    return this.updateResource(`/pages/${pageId}`, options);
  }

  /**
   * Archive a page (convenience method).
   *
   * @param pageId - The ID of the page to archive
   * @returns The archived page wrapped in a Page model
   */
  async archive(pageId: string): Promise<Page> {
    return this.update(pageId, { archived: true });
  }

  /**
   * Restore an archived page (convenience method).
   *
   * @param pageId - The ID of the page to restore
   * @returns The restored page wrapped in a Page model
   */
  async restore(pageId: string): Promise<Page> {
    return this.update(pageId, { archived: false });
  }
}
