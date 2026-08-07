import { BaseModel } from './base.model';
import { blockSchema, type NotionBlock } from '../schemas';

const TEXT_BLOCK_TYPES = new Set<NotionBlock['type']>([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
  'quote',
  'callout',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
]);

const HEADING_BLOCK_TYPES = new Set<NotionBlock['type']>([
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
]);

const CHILD_CONTAINER_BLOCK_TYPES = new Set<NotionBlock['type']>([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'toggle',
  'quote',
  'callout',
  'synced_block',
  'column',
  'column_list',
  'tab',
  'table',
]);

/**
 * Block model wrapping a validated Notion block object with helper methods.
 *
 * @category Blocks
 */
export class Block extends BaseModel<NotionBlock> {
  private cachedCreatedTimeMs?: number;
  private cachedLastEditedTimeMs?: number;

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

  get hasChildren(): boolean {
    return this.data.has_children;
  }

  /**
   * Check if this is a text-based block type.
   */
  isTextBlock(): boolean {
    return TEXT_BLOCK_TYPES.has(this.data.type);
  }

  /**
   * Check if this is a heading block.
   */
  isHeading(): boolean {
    return HEADING_BLOCK_TYPES.has(this.data.type);
  }

  /**
   * Check if this block can contain children.
   */
  canHaveChildren(): boolean {
    return CHILD_CONTAINER_BLOCK_TYPES.has(this.data.type);
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
