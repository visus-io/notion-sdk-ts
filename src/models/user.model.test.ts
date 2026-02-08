import { describe, expect, it } from 'vitest';
import { User } from '.';

describe('User', () => {
  it('should create a valid person user model', () => {
    const userData = {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'person' as const,
      name: 'John Doe',
      avatar_url: 'https://example.com/avatar.png',
      person: {
        email: 'test@test.com',
      },
    };

    const user = new User(userData);
    expect(user.object).toBe('user');
    expect(user.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(user.type).toBe('person');
    expect(user.name).toBe('John Doe');
    expect(user.avatarUrl).toBe('https://example.com/avatar.png');
    expect(user.isPerson()).toBe(true);
    expect(user.isBot()).toBe(false);
    expect(user.getEmail()).toBe('test@test.com');
  });

  it('should identify bot users', () => {
    const botData = {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'bot' as const,
      name: 'Bot Assistant',
      avatar_url: null,
      bot: {
        owner: {
          type: 'workspace' as const,
          workspace: true as const,
        },
        workspace_name: 'Test Workspace',
      },
    };

    const bot = new User(botData);
    expect(bot.isBot()).toBe(true);
    expect(bot.isPerson()).toBe(false);
    expect(bot.getBotInfo()?.workspace_name).toBe('Test Workspace');
  });

  it('should handle partial users', () => {
    const partialData = {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const user = new User(partialData);
    expect(user.object).toBe('user');
    expect(user.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(user.type).toBeUndefined();
    expect(user.name).toBeUndefined();
    expect(user.avatarUrl).toBeUndefined();
    expect(user.isPerson()).toBe(false);
    expect(user.isBot()).toBe(false);
  });

  it('should serialize to JSON', () => {
    const userData = {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'person' as const,
      name: 'Jane Doe',
      person: {
        email: 'test@test.com',
      },
    };

    const user = new User(userData);
    const json = user.toJSON();
    expect(json).toEqual(userData);
  });

  it('should return undefined for getEmail when not a person', () => {
    const botData = {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'bot' as const,
      name: 'Bot Assistant',
      avatar_url: null,
      bot: {
        owner: {
          type: 'workspace' as const,
          workspace: true as const,
        },
      },
    };

    const bot = new User(botData);
    expect(bot.getEmail()).toBeUndefined();
  });

  it('should return undefined for getBotInfo when not a bot', () => {
    const userData = {
      object: 'user' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'person' as const,
      name: 'John Doe',
      avatar_url: 'https://example.com/avatar.png',
      person: {
        email: 'test@test.com',
      },
    };

    const user = new User(userData);
    expect(user.getBotInfo()).toBeUndefined();
  });
});
