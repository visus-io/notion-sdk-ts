import { describe, expect, it } from 'vitest';
import { customEmojiSchema } from './customEmoji.schema';

describe('customEmojiSchema', () => {
  it('should parse a valid custom emoji', () => {
    const result = customEmojiSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'party-parrot',
      url: 'https://example.com/party-parrot.png',
    });
    expect(result.success).toBe(true);
  });

  it('should reject an invalid id', () => {
    const result = customEmojiSchema.safeParse({
      id: 'not-a-uuid',
      name: 'party-parrot',
      url: 'https://example.com/party-parrot.png',
    });
    expect(result.success).toBe(false);
  });
});
