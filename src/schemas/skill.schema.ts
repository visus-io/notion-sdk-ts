import * as z from 'zod';

/**
 * Agent Skills schemas.
 *
 * A skill is a page in a Skills database. Its content is the `SKILL.md` file, and its **Files**
 * property holds the supporting files. A plugin groups the skills that share a tag. An untagged
 * skill is a plugin of its own. `version_id` changes only when the content changes.
 *
 * Notion API reference:
 * https://developers.notion.com/guides/agent-skills/overview
 */

/**
 * A plugin in a plugin list.
 *
 * @category Agents
 */
export const skillPluginSchema = z.looseObject({
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim(),
  /** An opaque content version. The same value means the same content. */
  version_id: z.string().trim(),
});
/**
 * @category Agents
 */
export type SkillPlugin = z.infer<typeof skillPluginSchema>;

/**
 * A download link for a plugin or a skill. The `url` is a temporary signed link to a gzipped
 * tar archive.
 *
 * @category Agents
 */
export const skillDownloadSchema = z.looseObject({
  id: z.string().trim(),
  version_id: z.string().trim(),
  url: z.url(),
});
/**
 * @category Agents
 */
export type SkillDownload = z.infer<typeof skillDownloadSchema>;

/**
 * Response of a skill upload.
 *
 * @category Agents
 */
export const skillUploadResultSchema = z.looseObject({
  status: z.literal('completed'),
  page_id: z.string().trim(),
  version_id: z.string().trim(),
});
/**
 * @category Agents
 */
export type SkillUploadResult = z.infer<typeof skillUploadResultSchema>;
