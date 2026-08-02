import { describe, expect, it } from 'vitest';
import { CustomEmoji } from '.';

describe('CustomEmoji', () => {
  it('should expose getters for a custom emoji', () => {
    const customEmoji = new CustomEmoji({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'party-parrot',
      url: 'https://example.com/party-parrot.png',
    });

    expect(customEmoji.object).toBe('custom_emoji');
    expect(customEmoji.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(customEmoji.name).toBe('party-parrot');
    expect(customEmoji.url).toBe('https://example.com/party-parrot.png');
  });
});
