import { BaseModel } from './base.model';
import { customEmojiSchema, type NotionCustomEmoji } from '../schemas';

/**
 * Custom Emoji model class with helper methods.
 *
 * @category Custom Emoji & Icons
 */
export class CustomEmoji extends BaseModel<NotionCustomEmoji> {
  constructor(data: NotionCustomEmoji) {
    super(data, customEmojiSchema);
  }

  /**
   * Returns "custom_emoji" - the object type.
   *
   * Note: A custom emoji list item has no `object` field in the API response. Only
   * the paginated list wrapper has that field. This getter returns a synthetic
   * value, not data from the payload, to meet the {@link BaseModel} contract.
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
