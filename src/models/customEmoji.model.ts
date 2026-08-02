import { BaseModel } from './base.model';
import { customEmojiSchema, type NotionCustomEmoji } from '../schemas';

/**
 * Custom Emoji model class with helper methods.
 */
export class CustomEmoji extends BaseModel<NotionCustomEmoji> {
  constructor(data: NotionCustomEmoji) {
    super(data, customEmojiSchema);
  }

  /**
   * Returns "custom_emoji" - the object type.
   *
   * Note: individual custom emoji list items have no `object` field of their own in
   * the API response (only the paginated list wrapper does) -- this getter is
   * synthetic, not sourced from the payload, to satisfy {@link BaseModel}'s contract.
   */
  get object(): 'custom_emoji' {
    return 'custom_emoji';
  }

  /**
   * Returns the custom emoji ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the custom emoji name.
   */
  get name(): string {
    return this.data.name;
  }

  /**
   * Returns the custom emoji's image URL.
   */
  get url(): string {
    return this.data.url;
  }
}
