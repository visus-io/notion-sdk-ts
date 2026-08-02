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
 */

export const pageMarkdownSchema = z.object({
  object: z.literal('page_markdown'),
  id: z.uuid(),
  // eslint-disable-next-line zod/prefer-string-schema-with-trim -- markdown content must preserve leading/trailing whitespace and newlines
  markdown: z.string(),
  truncated: z.boolean(),
  unknown_block_ids: z.array(z.uuid()).max(100),
});
export type PageMarkdown = z.infer<typeof pageMarkdownSchema>;

/**
 * `PATCH /v1/pages/{page_id}/markdown` returns `pageMarkdownSchema` synchronously, or
 * (when `allow_async: true` triggers async processing) an `async_task` handle to poll
 * via {@link AsyncTasksAPI}. Both response bodies carry a literal `object` field, so
 * they discriminate cleanly without needing the HTTP status code.
 */
export const markdownContentResponseSchema = z.discriminatedUnion('object', [
  pageMarkdownSchema,
  asyncTaskSchema,
]);
export type MarkdownContentResponse = z.infer<typeof markdownContentResponseSchema>;
