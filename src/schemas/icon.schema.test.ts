import { describe, expect, it } from 'vitest';
import { iconSchema } from './icon.schema';

describe('iconSchema', () => {
  it('should parse a native icon with color', () => {
    const icon = {
      type: 'icon' as const,
      icon: { name: 'star circle', color: 'blue' as const },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(true);
  });

  it('should parse a native icon without color', () => {
    const icon = {
      type: 'icon' as const,
      icon: { name: 'token' },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid native icon color', () => {
    const icon = {
      type: 'icon' as const,
      icon: { name: 'token', color: 'not-a-color' },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(false);
  });

  it('should parse a custom emoji icon', () => {
    const icon = {
      type: 'custom_emoji' as const,
      custom_emoji: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'party-parrot',
        url: 'https://example.com/emoji.png',
      },
    };

    const result = iconSchema.safeParse(icon);
    expect(result.success).toBe(true);
  });

  it('should still parse emoji and file icons', () => {
    expect(iconSchema.safeParse({ type: 'emoji', emoji: '🎉' }).success).toBe(true);
    expect(
      iconSchema.safeParse({ type: 'external', external: { url: 'https://example.com/i.png' } })
        .success,
    ).toBe(true);
  });
});
