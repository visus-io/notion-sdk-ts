import { describe, expect, it } from 'vitest';
import { syncMetadataSchema } from './syncMetadata.schema';
import { buildSyncMetadata } from '../testUtils/fixtures';

describe('syncMetadataSchema', () => {
  // ---------------------------------------------------------------------------
  // External database sync
  // ---------------------------------------------------------------------------

  it('should parse a healthy external database sync', () => {
    const data = buildSyncMetadata();

    expect(syncMetadataSchema.parse(data)).toEqual(data);
  });

  it('should parse a null health value', () => {
    const result = syncMetadataSchema.parse(buildSyncMetadata({ health: null }));

    expect(result.health).toBeNull();
  });

  it('should parse a paused sync that has no resource', () => {
    const result = syncMetadataSchema.parse({
      external_database_sync: { sync_id: '623e4567-e89b-12d3-a456-426614174000', provider: 'jira' },
      health: { paused: true },
    });

    expect(result.health?.paused).toBe(true);
    expect(result.resource).toBeUndefined();
  });

  it('should parse a failing sync with an error', () => {
    const result = syncMetadataSchema.parse(
      buildSyncMetadata({
        health: {
          paused: false,
          stage: 'steady',
          ok: false,
          error: { code: 'auth_expired', severity: 'action_required' },
          checks: { sync_version_updated_at: '2026-11-01T00:00:00.000Z' },
        },
      }),
    );

    expect(result.health?.ok).toBe(false);
    expect(result.health?.error?.severity).toBe('action_required');
  });

  it('should keep unknown keys and accept an unknown provider', () => {
    const result = syncMetadataSchema.parse({
      external_database_sync: { provider: 'linear', future_field: 1 },
      future_top_level: 'x',
    });

    expect(result.external_database_sync?.provider).toBe('linear');
    expect(result).toHaveProperty('future_top_level', 'x');
  });

  it('should accept a health timestamp in an unexpected format', () => {
    const result = syncMetadataSchema.safeParse(
      buildSyncMetadata({ health: { checks: { sync_version_updated_at: '1730851200' } } }),
    );

    expect(result.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Legacy synced collection
  // ---------------------------------------------------------------------------

  it('should parse a legacy sync state that hit the row limit', () => {
    const result = syncMetadataSchema.parse({
      external_collection_type: 'Jira',
      sync_state: {
        syncing: 'row_limit_exceeded',
        last_synced_at: '2026-10-01T00:00:00.000Z',
      },
    });

    expect(result.sync_state?.syncing).toBe('row_limit_exceeded');
  });

  it('should accept an undocumented syncing value', () => {
    const result = syncMetadataSchema.parse({ sync_state: { syncing: 'paused' } });

    expect(result.sync_state?.syncing).toBe('paused');
  });

  it('should accept a sync state without syncing', () => {
    const result = syncMetadataSchema.safeParse({ sync_state: {} });

    expect(result.success).toBe(true);
  });
});
