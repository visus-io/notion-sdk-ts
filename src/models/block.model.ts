import { BaseModel } from './base.model';
import { blockSchema, type NotionBlock } from '../schemas';

/**
 * Block model wrapping a validated Notion block object with helper methods.
 */
export class Block extends BaseModel<NotionBlock> {
  constructor(data: unknown) {
    super(data as NotionBlock, blockSchema);
  }

  get object(): string {
    return this.data.object;
  }

  get id(): string {
    return this.data.id;
  }

  get type(): NotionBlock['type'] {
    return this.data.type;
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

  get hasChildren(): boolean {
    return this.data.has_children;
  }

  /**
   * Check if this is a text-based block type.
   */
  isTextBlock(): boolean {
    return [
      'paragraph',
      'heading_1',
      'heading_2',
      'heading_3',
      'quote',
      'callout',
      'bulleted_list_item',
      'numbered_list_item',
      'to_do',
      'toggle',
    ].includes(this.data.type);
  }

  /**
   * Check if this is a heading block.
   */
  isHeading(): boolean {
    return ['heading_1', 'heading_2', 'heading_3'].includes(this.data.type);
  }

  /**
   * Check if this block can contain children.
   */
  canHaveChildren(): boolean {
    return [
      'paragraph',
      'heading_1',
      'heading_2',
      'heading_3',
      'bulleted_list_item',
      'numbered_list_item',
      'to_do',
      'toggle',
      'quote',
      'callout',
      'synced_block',
      'column',
      'column_list',
      'table',
    ].includes(this.data.type);
  }

  /**
   * Get the plain text content from text-based blocks.
   */
  getPlainText(): string | null {
    const typeData = (this.data as Record<string, unknown>)[this.data.type];
    if (
      typeData &&
      typeof typeData === 'object' &&
      'rich_text' in typeData &&
      Array.isArray(typeData.rich_text)
    ) {
      return typeData.rich_text.map((rt: { plain_text: string }) => rt.plain_text).join('');
    }
    return null;
  }
}
