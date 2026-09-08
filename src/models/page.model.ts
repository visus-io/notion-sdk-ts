import { BaseModel, type TRUSTED } from './base.model';
import { type NotionPage, type NotionPageProperties, pageSchema } from '../schemas';

/**
 * Page model wrapping a validated Notion page object with helper methods.
 *
 * @category Pages
 */
export class Page extends BaseModel<NotionPage> {
  private cachedCreatedTimeMs?: number;
  private cachedLastEditedTimeMs?: number;

  constructor(data: unknown, trusted?: typeof TRUSTED) {
    super(data as NotionPage, pageSchema, trusted);
  }

  get object(): string {
    return this.data.object;
  }

  get id(): string {
    return this.data.id;
  }

  get createdTime(): Date {
    this.cachedCreatedTimeMs ??= new Date(this.data.created_time).getTime();
    return new Date(this.cachedCreatedTimeMs);
  }

  get lastEditedTime(): Date {
    this.cachedLastEditedTimeMs ??= new Date(this.data.last_edited_time).getTime();
    return new Date(this.cachedLastEditedTimeMs);
  }

  get inTrash(): boolean {
    return this.data.in_trash;
  }

  get isArchived(): boolean {
    return this.data.is_archived ?? false;
  }

  get isLocked(): boolean {
    return this.data.is_locked ?? false;
  }

  get url(): string {
    return this.data.url;
  }

  get publicUrl(): string | null {
    return this.data.public_url;
  }

  get properties(): Record<string, NotionPageProperties> {
    return this.data.properties;
  }

  /**
   * Get a specific property by name.
   */
  getProperty(name: string): NotionPageProperties | undefined {
    return this.data.properties[name];
  }

  /**
   * Get the title property if it exists.
   */
  getTitle(): string | null {
    for (const prop of Object.values(this.data.properties)) {
      if (prop.type === 'title' && prop.title) {
        return prop.title.map((rt: { plain_text: string }) => rt.plain_text).join('');
      }
    }
    return null;
  }

  /**
   * Check if the page is a row in a database.
   *
   * On API version 2025-09-03 and later, a database row has a `data_source_id`
   * parent. Older responses use a `database_id` parent. This method returns `true`
   * for both.
   */
  isInDatabase(): boolean {
    return this.data.parent.type === 'data_source_id' || this.data.parent.type === 'database_id';
  }

  /**
   * Check if the page is a row in a data source.
   */
  isInDataSource(): boolean {
    return this.data.parent.type === 'data_source_id';
  }

  /**
   * Check if the page is a child of another page.
   */
  isSubpage(): boolean {
    return this.data.parent.type === 'page_id';
  }

  /**
   * Get the parent data source ID.
   * Return `null` when the parent is not a data source.
   */
  getParentDataSourceId(): string | null {
    return this.data.parent.type === 'data_source_id' ? this.data.parent.data_source_id : null;
  }

  /**
   * Get the parent database ID.
   * A `data_source_id` parent also carries its database ID. Return `null` when the
   * parent is neither a database nor a data source.
   */
  getParentDatabaseId(): string | null {
    if (this.data.parent.type === 'database_id') {
      return this.data.parent.database_id;
    }
    if (this.data.parent.type === 'data_source_id') {
      return this.data.parent.database_id;
    }
    return null;
  }
}
