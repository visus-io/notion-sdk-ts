import { BaseModel } from './base.model';
import { type BotUser, type NotionUser, type PersonUser, userSchema } from '../schemas';

/**
 * User model wrapping a validated Notion user object with helper methods.
 */
export class User extends BaseModel<NotionUser> {
  constructor(data: unknown) {
    super(data as NotionUser, userSchema);
  }

  get object(): string {
    return this.data.object;
  }

  get id(): string {
    return this.data.id;
  }

  get type(): 'person' | 'bot' | undefined {
    return 'type' in this.data ? this.data.type : undefined;
  }

  get name(): string | undefined {
    return 'name' in this.data ? this.data.name : undefined;
  }

  get avatarUrl(): string | null | undefined {
    return 'avatar_url' in this.data ? this.data.avatar_url : undefined;
  }

  /**
   * Check if this is a person user.
   */
  isPerson(): this is User & { data: PersonUser } {
    return 'type' in this.data && this.data.type === 'person';
  }

  /**
   * Check if this is a bot user.
   */
  isBot(): this is User & { data: BotUser } {
    return 'type' in this.data && this.data.type === 'bot';
  }

  /**
   * Get email if this is a person user.
   */
  getEmail(): string | undefined {
    if (this.isPerson()) {
      return this.data.person.email;
    }
    return undefined;
  }

  /**
   * Get bot information if this is a bot user.
   */
  getBotInfo():
    | {
        owner: { type: 'workspace'; workspace: true } | { type: 'user' };
        workspace_name?: string | null;
        workspace_id?: string;
        workspace_limits?: { max_file_upload_size_in_bytes: number };
      }
    | undefined {
    if (this.isBot()) {
      return this.data.bot;
    }
    return undefined;
  }
}
