import { BaseModel } from './base.model';
import { type NotionPage, type NotionPageProperties, pageSchema } from '../schemas';

/**
 * Page model wrapping a validated Notion page object with helper methods.
 */
export class Page extends BaseModel<NotionPage> {
  constructor(data: unknown) {
    super(data as NotionPage, pageSchema);
  }

  get object(): string {
    return this.data.object;
  }

  get id(): string {
    return this.data.id;
  }

  get createdTime(): Date {
    return new Date(this.data.created_time);
  }

  get lastEditedTime(): Date {
    return new Date(this.data.last_edited_time);
  }

  get archived(): boolean {
    return this.data.archived;
  }

  get inTrash(): boolean {
    return this.data.in_trash;
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
   * Check if the page is a child of a database.
   */
  isInDatabase(): boolean {
    return this.data.parent.type === 'database_id';
  }

  /**
   * Check if the page is a child of another page.
   */
  isSubpage(): boolean {
    return this.data.parent.type === 'page_id';
  }
}
