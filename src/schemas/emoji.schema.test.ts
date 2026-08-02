import { describe, expect, it } from 'vitest';
import { emojiSchema } from './emoji.schema';

describe('emojiSchema', () => {
  it('should parse valid emoji', () => {
    const emoji = {
      type: 'emoji' as const,
      emoji: '🎉',
    };

    const result = emojiSchema.safeParse(emoji);
    expect(result.success).toBe(true);
  });

  it('should trim emoji whitespace', () => {
    const emoji = {
      type: 'emoji' as const,
      emoji: '  😀  ',
    };

    const result = emojiSchema.safeParse(emoji);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emoji).toBe('😀');
    }
  });
});
