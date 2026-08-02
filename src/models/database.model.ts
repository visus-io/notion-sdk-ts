import { BaseModel } from './base.model';
import {
  databaseSchema,
  type DataSourceRef,
  type NotionDatabase,
  type NotionFile,
  type NotionIcon,
  type NotionParent,
  type NotionRichText,
  type NotionUser,
} from '../schemas';

/**
 * Database model class with helper methods.
 *
 * @category Databases & Data Sources
 */
export class Database extends BaseModel<NotionDatabase> {
  constructor(data: NotionDatabase) {
    super(data, databaseSchema);
  }

  /**
   * Returns "database" - the object type.
   */
  get object(): 'database' {
    return this.data.object;
  }

  /**
   * Returns the database ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the data sources array.
   */
  get dataSources(): DataSourceRef[] {
    return this.data.data_sources;
  }

  /**
   * Returns the created time as a Date object.
   */
  get createdTime(): Date {
    return new Date(this.data.created_time);
  }

  /**
   * Returns the user who created the database.
   */
  get createdBy(): NotionUser {
    return this.data.created_by;
  }

  /**
   * Returns the last edited time as a Date object.
   */
  get lastEditedTime(): Date {
    return new Date(this.data.last_edited_time);
  }

  /**
   * Returns the user who last edited the database.
   */
  get lastEditedBy(): NotionUser {
    return this.data.last_edited_by;
  }

  /**
   * Returns the database title as rich text array.
   */
  get title(): NotionRichText {
    return this.data.title;
  }

  /**
   * Returns the database description as rich text array.
   */
  get description(): NotionRichText {
    return this.data.description;
  }

  /**
   * Returns the database icon (file, emoji, native icon, or custom emoji).
   */
  get icon(): NotionIcon | null {
    return this.data.icon;
  }

  /**
   * Returns the database cover image.
   */
  get cover(): NotionFile | null {
    return this.data.cover;
  }

  /**
   * Returns the parent object.
   */
  get parent(): NotionParent {
    return this.data.parent;
  }

  /**
   * Returns the Notion URL of the database.
   */
  get url(): string {
    return this.data.url;
  }

  /**
   * Returns whether the database is in trash.
   */
  get inTrash(): boolean {
    return this.data.in_trash;
  }

  /**
   * Returns whether the database is inline.
   */
  get isInline(): boolean {
    return this.data.is_inline;
  }

  /**
   * Returns whether the database is locked from editing.
   */
  get isLocked(): boolean {
    return this.data.is_locked ?? false;
  }

  /**
   * Returns the public URL if published, otherwise null.
   */
  get publicUrl(): string | null {
    return this.data.public_url;
  }

  /**
   * Extracts the plain text title from the database.
   */
  getTitle(): string {
    return this.data.title.map((rt) => rt.plain_text).join('');
  }

  /**
   * Extracts the plain text description from the database.
   */
  getDescription(): string {
    return this.data.description.map((rt) => rt.plain_text).join('');
  }

  /**
   * Checks if the database is a full page (not inline).
   */
  isFullPage(): boolean {
    return !this.data.is_inline;
  }

  /**
   * Checks if the parent is a page.
   */
  hasPageParent(): boolean {
    return this.data.parent.type === 'page_id';
  }

  /**
   * Checks if the parent is a workspace.
   */
  hasWorkspaceParent(): boolean {
    return this.data.parent.type === 'workspace';
  }
}
