import * as z from 'zod';

/**
 * Sync metadata schemas.
 *
 * A data source that an external sync fills (for example GitHub, Jira, or Salesforce) has a
 * read-only `sync_metadata` object. Notion returns it on data source responses and on each
 * readable data source in a database response. Every field is optional. Notion can add new
 * fields and new provider values, so these schemas keep unknown keys and accept any string.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/data-source
 */

/**
 * A sync timestamp. Notion documents UTC ISO 8601 strings. The schema does not check the format,
 * so that a format change in this read-only metadata cannot break the parse of the data source.
 */
const syncTimestampSchema = z.string().trim().optional();

/** Health checks for a sync. A missing timestamp means "unknown". */
const syncHealthChecksSchema = z.looseObject({
  /** Last change to the sync configuration. This is not the last successful ingestion. */
  sync_version_updated_at: syncTimestampSchema,
  last_execution_succeeded_at: syncTimestampSchema,
  delta_synced_through_at: syncTimestampSchema,
});

/** Sync error. Notion sends it when `ok` is `false`. */
const syncHealthErrorSchema = z.looseObject({
  code: z.unknown().optional(),
  /** Documented values: `action_required`, `degraded`, `failing`. */
  severity: z.string().trim().optional(),
});

/**
 * Sync health.
 *
 * @category Databases & Data Sources
 */
export const syncHealthSchema = z.looseObject({
  paused: z.boolean().optional(),
  /** Documented values: `initializing`, `backfilling`, `steady`. */
  stage: z.string().trim().optional(),
  ok: z.boolean().optional(),
  error: syncHealthErrorSchema.optional(),
  checks: syncHealthChecksSchema.optional(),
});

/**
 * @category Databases & Data Sources
 */
export type SyncHealth = z.infer<typeof syncHealthSchema>;

/** Sync state for a legacy synced collection. */
const syncStateSchema = z.looseObject({
  /** Documented values: `true`, `false`, `'row_limit_exceeded'`. Notion can add new values. */
  syncing: z.union([z.boolean(), z.string().trim()]).optional(),
  last_synced_at: syncTimestampSchema,
  last_sync_checkpoint_at: syncTimestampSchema,
  last_sync_heartbeat_at: syncTimestampSchema,
});

/**
 * Read-only sync metadata on a data source.
 *
 * `health: null` means that Notion could not get the health. It does not mean that the sync is
 * unhealthy.
 *
 * @category Databases & Data Sources
 */
export const syncMetadataSchema = z.looseObject({
  external_database_sync: z
    .looseObject({
      sync_id: z.string().trim().optional(),
      /** Documented values: `github`, `jira`, `salesforce`. */
      provider: z.string().trim().optional(),
    })
    .optional(),
  /** Legacy synced collection type. Documented values: `Jira`, `Salesforce`. */
  external_collection_type: z.string().trim().optional(),
  sync_state: syncStateSchema.optional(),
  sync_id: z.string().trim().optional(),
  synced_collection_key: z.string().trim().optional(),
  owner_user_id: z.string().trim().optional(),
  resource: z.string().trim().optional(),
  health: syncHealthSchema.nullish(),
});

/**
 * @category Databases & Data Sources
 */
export type SyncMetadata = z.infer<typeof syncMetadataSchema>;
