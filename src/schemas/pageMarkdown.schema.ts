import * as z from 'zod';
import { asyncTaskSchema } from './asyncTask.schema';

/**
 * Page markdown content schemas.
 *
 * `GET`/`PATCH /v1/pages/{page_id}/markdown` read and write a page's content as
 * markdown directly, as an alternative to the block-tree `children` representation.
 *
 * Notion API reference:
 * https://developers.notion.com/guides/data-apis/working-with-markdown-content
 *
 * @category Pages
 */

/**
 * Markdown syntax versions.
 *
 * - `v1`: enhanced markdown. Deprecated. The next Notion API version rejects it.
 * - `v2`: Notion-flavored Markdown. Notion recommends this version.
 *
 * On API version `2026-03-11`, the server default is `v1`.
 *
 * @category Pages
 */
export const MARKDOWN_VERSIONS = ['v1', 'v2'] as const;

/**
 * @category Pages
 */
export type MarkdownVersion = (typeof MARKDOWN_VERSIONS)[number];

/**
 * A warning from a markdown write. Examples of `code`: `no_match`, `indentation_mismatch`,
 * `unsupported_tag`. Notion can add new codes.
 *
 * Notion sends warnings after it applies a write. The schema accepts a warning without a
 * `message` and keeps unknown keys, so that a change in the warning shape cannot make a
 * successful write look like a failure.
 *
 * @category Pages
 */
export const pageMarkdownWarningSchema = z.looseObject({
  code: z.string().trim(),
  message: z.string().trim().optional(),
});
/**
 * @category Pages
 */
export type PageMarkdownWarning = z.infer<typeof pageMarkdownWarningSchema>;

export const pageMarkdownSchema = z.object({
  object: z.literal('page_markdown'),
  id: z.uuid(),
  // eslint-disable-next-line zod/prefer-string-schema-with-trim -- markdown content must preserve leading/trailing whitespace and newlines
  markdown: z.string(),
  truncated: z.boolean(),
  unknown_block_ids: z.array(z.uuid()),
  /**
   * Warnings from a markdown write. Notion sends this field only when there is at least one
   * warning. An async update does not return warnings.
   */
  warnings: z.array(pageMarkdownWarningSchema).optional(),
});
/**
 * @category Pages
 */
export type PageMarkdown = z.infer<typeof pageMarkdownSchema>;

/**
 * `PATCH /v1/pages/{page_id}/markdown` returns `pageMarkdownSchema` synchronously. If
 * `allow_async: true` triggers async processing, it returns an `async_task` handle
 * instead. Poll the handle through {@link AsyncTasksAPI}. Both response bodies carry a
 * literal `object` field, so you can discriminate between them without checking the
 * HTTP status code.
 *
 * @category Pages
 */
export const markdownContentResponseSchema = z.discriminatedUnion('object', [
  pageMarkdownSchema,
  asyncTaskSchema,
]);
/**
 * @category Pages
 */
export type MarkdownContentResponse = z.infer<typeof markdownContentResponseSchema>;
