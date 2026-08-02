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

export const pageMarkdownSchema = z.object({
  object: z.literal('page_markdown'),
  id: z.uuid(),
  // eslint-disable-next-line zod/prefer-string-schema-with-trim -- markdown content must preserve leading/trailing whitespace and newlines
  markdown: z.string(),
  truncated: z.boolean(),
  unknown_block_ids: z.array(z.uuid()).max(100),
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
