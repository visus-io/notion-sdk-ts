import { describe, expect, it } from 'vitest';
import { parentSchema } from './parent.schema';

describe('parentSchema', () => {
  it('should parse database parent', () => {
    const parent = {
      type: 'database_id' as const,
      database_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse data_source parent', () => {
    const parent = {
      type: 'data_source_id' as const,
      data_source_id: '123e4567-e89b-12d3-a456-426614174001',
      database_id: '123e4567-e89b-12d3-a456-426614174002',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse page parent', () => {
    const parent = {
      type: 'page_id' as const,
      page_id: '123e4567-e89b-12d3-a456-426614174003',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse workspace parent', () => {
    const parent = {
      type: 'workspace' as const,
      workspace: true as const,
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse block parent', () => {
    const parent = {
      type: 'block_id' as const,
      block_id: '123e4567-e89b-12d3-a456-426614174004',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });

  it('should parse agent parent', () => {
    const parent = {
      type: 'agent_id' as const,
      agent_id: '123e4567-e89b-12d3-a456-426614174005',
    };

    const result = parentSchema.safeParse(parent);
    expect(result.success).toBe(true);
  });
});
