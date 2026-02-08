import { BaseModel } from './base.model';
import {
  dataSourceSchema,
  type NotionDataSource,
  type NotionEmoji,
  type NotionFile,
  type NotionParent,
  type NotionPropertiesObject,
  type NotionPropertyObject,
  type NotionRichText,
  type NotionUser,
} from '../schemas';

/**
 * Data Source model class with helper methods.
 *
 * Data sources are individual tables of data that live under a Notion database.
 */
export class DataSource extends BaseModel<NotionDataSource> {
  constructor(data: NotionDataSource) {
    super(data, dataSourceSchema);
  }

  /**
   * Returns "data_source" - the object type.
   */
  get object(): 'data_source' {
    return this.data.object;
  }

  /**
   * Returns the data source ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the properties object (data source schema).
   */
  get properties(): NotionPropertiesObject {
    return this.data.properties;
  }

  /**
   * Returns the parent object (database reference).
   */
  get parent(): NotionParent {
    return this.data.parent;
  }

  /**
   * Returns the database parent object (data source's grandparent).
   */
  get databaseParent(): NotionParent {
    return this.data.database_parent;
  }

  /**
   * Returns the created time as a Date object.
   */
  get createdTime(): Date {
    return new Date(this.data.created_time);
  }

  /**
   * Returns the user who created the data source.
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
   * Returns the user who last edited the data source.
   */
  get lastEditedBy(): NotionUser {
    return this.data.last_edited_by;
  }

  /**
   * Returns the data source title as rich text array.
   */
  get title(): NotionRichText {
    return this.data.title;
  }

  /**
   * Returns the data source description as rich text array.
   */
  get description(): NotionRichText {
    return this.data.description;
  }

  /**
   * Returns the data source icon (file or emoji).
   */
  get icon(): NotionFile | NotionEmoji | null {
    return this.data.icon;
  }

  /**
   * Returns the data source cover image.
   */
  get cover(): NotionFile | null {
    return this.data.cover;
  }

  /**
   * Returns the Notion URL of the data source.
   */
  get url(): string {
    return this.data.url;
  }

  /**
   * Returns the public URL if published, otherwise null.
   */
  get publicUrl(): string | null {
    return this.data.public_url;
  }

  /**
   * Returns whether the data source is inline.
   */
  get isInline(): boolean {
    return this.data.is_inline;
  }

  /**
   * Returns the archived status.
   */
  get archived(): boolean {
    return this.data.archived;
  }

  /**
   * Returns whether the data source is in trash.
   */
  get inTrash(): boolean {
    return this.data.in_trash;
  }

  /**
   * Extracts the plain text title from the data source.
   */
  getTitle(): string {
    return this.data.title.map((rt) => rt.plain_text).join('');
  }

  /**
   * Extracts the plain text description from the data source.
   */
  getDescription(): string {
    return this.data.description.map((rt) => rt.plain_text).join('');
  }

  /**
   * Returns the parent database ID if parent type is database_id.
   */
  getParentDatabaseId(): string | undefined {
    if (this.data.parent.type === 'database_id') {
      return this.data.parent.database_id;
    }
    return undefined;
  }

  /**
   * Gets a specific property configuration by name.
   */
  getProperty(name: string): NotionPropertyObject | undefined {
    return this.data.properties[name];
  }

  /**
   * Gets all property names.
   */
  getPropertyNames(): string[] {
    return Object.keys(this.data.properties);
  }

  /**
   * Checks if the data source has a specific property.
   */
  hasProperty(name: string): boolean {
    return name in this.data.properties;
  }
}
