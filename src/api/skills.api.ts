import type { NotionClient } from '../client';
import {
  type PaginatedList,
  type SkillDownload,
  skillDownloadSchema,
  type SkillPlugin,
  skillPluginSchema,
  type SkillUploadResult,
  skillUploadResultSchema,
} from '../schemas';
import { LIMITS, NotionValidationError } from '../validation';
import { validatePageSize } from './agentQuery';
import { parsePaginatedResponse } from './base.api';
import { byteLengthOf, type FileData, toBlob } from './fileData';

/**
 * Options for listing plugins.
 */
export interface ListSkillPluginsOptions {
  /** Plugins per page (1 to 100) */
  page_size?: number;

  /** The `next_cursor` of the previous page. The SDK treats `null` the same as omitted. */
  start_cursor?: string | null;
}

/**
 * Agent Skills API client for downloading and uploading skills.
 *
 * The SDK does not build or extract archives. Download the `url` of a plugin or a skill, and
 * extract the gzipped tar archive yourself. For an upload, build the archive yourself.
 *
 * @category Agents
 */
export class SkillsAPI {
  constructor(private readonly client: NotionClient) {}

  /**
   * List the plugins that the token can read. A plugin groups the skills that share a tag. An
   * untagged skill is a plugin of its own.
   *
   * To sync plugins, list every page and compare each `version_id` with the value you stored.
   * Download only the plugins that changed. Remove a local plugin only after a complete listing.
   *
   * @param options - Pagination
   * @returns A paginated list of plugins
   *
   * @throws {NotionValidationError} If `page_size` is not an integer from 1 to 100.
   *
   * @see https://developers.notion.com/reference/agent-skills/list-skills-plugins
   */
  async listPlugins(options?: ListSkillPluginsOptions): Promise<PaginatedList<SkillPlugin>> {
    const query: Record<string, string> = {};
    if (options?.page_size !== undefined) {
      validatePageSize(options.page_size);
      query.page_size = String(options.page_size);
    }
    if (options?.start_cursor) {
      query.start_cursor = options.start_cursor;
    }

    const response = await this.client.request<unknown>({
      method: 'GET',
      path: '/ai/plugins',
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    return parsePaginatedResponse(skillPluginSchema, response, 'plugin');
  }

  /**
   * Get a download link for a plugin. The archive has `plugin.json` and a `skills/` folder.
   * The link expires. Download it soon after you get it.
   *
   * @param pluginId - The plugin ID
   * @returns The plugin ID, its `version_id`, and a signed `url` to a gzipped tar archive
   *
   * @see https://developers.notion.com/reference/agent-skills/get-plugin-directory
   */
  async retrievePlugin(pluginId: string): Promise<SkillDownload> {
    const response = await this.client.request<unknown>({
      method: 'GET',
      path: `/ai/plugins/${pluginId}`,
    });

    return skillDownloadSchema.parse(response);
  }

  /**
   * Get a download link for one skill. The archive has one directory with `SKILL.md` and the
   * files of the skill's **Files** property. The link expires.
   *
   * @param skillId - The page ID of the skill
   * @returns The skill ID, its `version_id`, and a signed `url` to a gzipped tar archive
   *
   * @see https://developers.notion.com/reference/agent-skills/get-skill-directory
   */
  async retrieve(skillId: string): Promise<SkillDownload> {
    const response = await this.client.request<unknown>({
      method: 'GET',
      path: `/ai/skills/${skillId}`,
    });

    return skillDownloadSchema.parse(response);
  }

  /**
   * Upload a skill directory to an existing page in a Skills database. To import a new skill,
   * create the page first.
   *
   * The archive must be a gzipped tar archive. It must have a `SKILL.md` file with `name` and
   * `description` frontmatter, at the root or in one directory. The upload replaces the page
   * title, **Description**, content, and **Files**.
   *
   * The SDK does not retry this call on a `504` response. A `504` does not mean that the
   * upload failed. Retrieve the skill and compare its `version_id` before you retry.
   *
   * @param skillId - The page ID of the skill
   * @param archive - The gzipped tar archive (max 20 MiB)
   * @returns The page ID and the new `version_id`
   *
   * @throws {NotionValidationError} If the archive is empty or larger than 20 MiB.
   *
   * @see https://developers.notion.com/reference/agent-skills/upload-skill
   */
  async upload(skillId: string, archive: FileData): Promise<SkillUploadResult> {
    const size = byteLengthOf(archive);
    if (size === 0) {
      throw new NotionValidationError('The skill archive is empty');
    }
    if (size > LIMITS.SKILL_ARCHIVE_BYTES) {
      throw new NotionValidationError(
        `The skill archive exceeds the ${LIMITS.SKILL_ARCHIVE_BYTES}-byte limit (got ${size})`,
      );
    }

    const form = new FormData();
    form.append('file', toBlob(archive, 'application/gzip'), 'skill.tar.gz');

    const response = await this.client.requestMultipart<unknown>(
      `/ai/skills/${skillId}/upload`,
      form,
    );

    return skillUploadResultSchema.parse(response);
  }
}
