import { BaseModel } from './base.model';
import {
  type CommentAttachment,
  type CommentDisplayName,
  commentSchema,
  type NotionComment,
  type NotionParent,
  type NotionRichText,
  type NotionUser,
} from '../schemas';

/**
 * Comment model class with helper methods.
 */
export class Comment extends BaseModel<NotionComment> {
  constructor(data: NotionComment) {
    super(data, commentSchema);
  }

  /**
   * Returns "comment" - the object type.
   */
  get object(): 'comment' {
    return this.data.object;
  }

  /**
   * Returns the comment ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the parent object (page, block, or database).
   */
  get parent(): NotionParent {
    return this.data.parent;
  }

  /**
   * Returns the discussion thread ID.
   */
  get discussionId(): string {
    return this.data.discussion_id;
  }

  /**
   * Returns the created time as a Date object.
   */
  get createdTime(): Date {
    return new Date(this.data.created_time);
  }

  /**
   * Returns the user who created the comment.
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
   * Returns the comment content as rich text array.
   */
  get richText(): NotionRichText {
    return this.data.rich_text;
  }

  /**
   * Returns the comment attachments (if any).
   */
  get attachments(): CommentAttachment[] | undefined {
    return this.data.attachments;
  }

  /**
   * Returns the comment display name (if set).
   */
  get displayName(): CommentDisplayName | undefined {
    return this.data.display_name;
  }

  /**
   * Extracts the plain text content from the comment.
   */
  getPlainText(): string {
    return this.data.rich_text.map((rt) => rt.plain_text).join('');
  }

  /**
   * Checks if the comment has attachments.
   */
  hasAttachments(): boolean {
    return !!this.data.attachments && this.data.attachments.length > 0;
  }

  /**
   * Checks if the comment has a custom display name.
   */
  hasCustomDisplayName(): boolean {
    return this.data.display_name?.type === 'custom';
  }

  /**
   * Gets the resolved display name (if available).
   */
  getDisplayName(): string | undefined {
    return this.data.display_name?.resolved_name;
  }

  /**
   * Checks if the parent is a page.
   */
  hasPageParent(): boolean {
    return this.data.parent.type === 'page_id';
  }

  /**
   * Checks if the parent is a block.
   */
  hasBlockParent(): boolean {
    return this.data.parent.type === 'block_id';
  }
}
