import type { CodeBlockLanguage, NotionColor, NotionRichText } from '../schemas';
import { LIMITS, validateStringLength } from '../validation';
import { RichTextBuilder } from './richText.helpers';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * Accepted rich text input: a plain string, a {@link RichTextBuilder}, or
 * a pre-built `NotionRichText` array.
 */
export type RichTextInput = string | RichTextBuilder | NotionRichText;

/** Resolve a {@link RichTextInput} into a `NotionRichText` array. */
function resolveRichText(input: RichTextInput): NotionRichText {
  if (typeof input === 'string') {
    validateStringLength(input, LIMITS.RICH_TEXT_CONTENT, 'Rich text content');
    return [
      {
        type: 'text',
        text: { content: input, link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: input,
        href: null,
      },
    ];
  }
  if (input instanceof RichTextBuilder) {
    return input.build();
  }
  return input;
}

/** Common options shared by text-bearing blocks. */
interface TextBlockOptions {
  color?: NotionColor;
  children?: unknown[];
}

// ---------------------------------------------------------------------------
// Block object type — the shape returned by every helper
// ---------------------------------------------------------------------------

/** The minimal block object accepted by the Notion API for creation. */
interface BlockObject {
  object: 'block';
  type: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Text blocks
// ---------------------------------------------------------------------------

/**
 * Create a paragraph block.
 *
 * @example
 * ```ts
 * block.paragraph('Hello world')
 * block.paragraph(richText('Hello').bold(), { color: 'blue' })
 * ```
 */
function paragraph(text: RichTextInput, options?: TextBlockOptions): BlockObject {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

/** Options for heading blocks. */
interface HeadingOptions {
  color?: NotionColor;
  isToggleable?: boolean;
  children?: unknown[];
}

function heading1(text: RichTextInput, options?: HeadingOptions): BlockObject {
  return {
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      is_toggleable: options?.isToggleable ?? false,
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

function heading2(text: RichTextInput, options?: HeadingOptions): BlockObject {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      is_toggleable: options?.isToggleable ?? false,
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

function heading3(text: RichTextInput, options?: HeadingOptions): BlockObject {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      is_toggleable: options?.isToggleable ?? false,
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

function bulletedListItem(text: RichTextInput, options?: TextBlockOptions): BlockObject {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

/** Options for numbered list items. */
interface NumberedListOptions extends TextBlockOptions {
  listStartIndex?: number;
  listFormat?: 'numbers' | 'letters' | 'roman';
}

function numberedListItem(text: RichTextInput, options?: NumberedListOptions): BlockObject {
  return {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      ...(options?.listStartIndex !== undefined
        ? { list_start_index: options.listStartIndex }
        : {}),
      ...(options?.listFormat ? { list_format: options.listFormat } : {}),
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

/** Options for to-do blocks. */
interface ToDoOptions extends TextBlockOptions {
  checked?: boolean;
}

function toDo(text: RichTextInput, options?: ToDoOptions): BlockObject {
  return {
    object: 'block',
    type: 'to_do',
    to_do: {
      rich_text: resolveRichText(text),
      checked: options?.checked ?? false,
      color: options?.color ?? 'default',
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

function toggle(text: RichTextInput, options?: TextBlockOptions): BlockObject {
  return {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

function quote(text: RichTextInput, options?: TextBlockOptions): BlockObject {
  return {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: resolveRichText(text),
      color: options?.color ?? 'default',
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

/** Options for callout blocks. */
interface CalloutOptions extends TextBlockOptions {
  icon?: { type: 'emoji'; emoji: string } | { type: 'external'; external: { url: string } };
}

function callout(text: RichTextInput, options?: CalloutOptions): BlockObject {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: resolveRichText(text),
      icon: options?.icon ?? { type: 'emoji', emoji: '💡' },
      color: options?.color ?? 'default',
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

function template(text: RichTextInput, options?: { children?: unknown[] }): BlockObject {
  return {
    object: 'block',
    type: 'template',
    template: {
      rich_text: resolveRichText(text),
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Code & equation blocks
// ---------------------------------------------------------------------------

/** Options for code blocks. */
interface CodeOptions {
  caption?: RichTextInput;
}

function code(content: string, language: CodeBlockLanguage, options?: CodeOptions): BlockObject {
  return {
    object: 'block',
    type: 'code',
    code: {
      rich_text: resolveRichText(content),
      language,
      caption: options?.caption ? resolveRichText(options.caption) : [],
    },
  };
}

function equation(expression: string): BlockObject {
  validateStringLength(expression, LIMITS.EQUATION_EXPRESSION, 'Equation expression');
  return {
    object: 'block',
    type: 'equation',
    equation: { expression },
  };
}

// ---------------------------------------------------------------------------
// Media blocks
// ---------------------------------------------------------------------------

/** A file source for media blocks: external URL or file-upload ID. */
type FileSource =
  | { type: 'external'; external: { url: string } }
  | { type: 'file_upload'; file_upload: { id: string } };

function parseFileSource(urlOrSource: string | FileSource): FileSource {
  if (typeof urlOrSource === 'string') {
    validateStringLength(urlOrSource, LIMITS.URL, 'URL');
    return { type: 'external', external: { url: urlOrSource } };
  }
  return urlOrSource;
}

/** Options for media blocks that support a caption. */
interface MediaOptions {
  caption?: RichTextInput;
}

function image(source: string | FileSource, options?: MediaOptions): BlockObject {
  return {
    object: 'block',
    type: 'image',
    image: {
      ...parseFileSource(source),
      ...(options?.caption ? { caption: resolveRichText(options.caption) } : {}),
    },
  };
}

function video(source: string | FileSource, options?: MediaOptions): BlockObject {
  return {
    object: 'block',
    type: 'video',
    video: {
      ...parseFileSource(source),
      ...(options?.caption ? { caption: resolveRichText(options.caption) } : {}),
    },
  };
}

function audio(source: string | FileSource): BlockObject {
  return {
    object: 'block',
    type: 'audio',
    audio: parseFileSource(source),
  };
}

function file(source: string | FileSource, options?: MediaOptions): BlockObject {
  return {
    object: 'block',
    type: 'file',
    file: {
      ...parseFileSource(source),
      ...(options?.caption ? { caption: resolveRichText(options.caption) } : {}),
    },
  };
}

function pdf(source: string | FileSource, options?: MediaOptions): BlockObject {
  return {
    object: 'block',
    type: 'pdf',
    pdf: {
      ...parseFileSource(source),
      ...(options?.caption ? { caption: resolveRichText(options.caption) } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Embed blocks
// ---------------------------------------------------------------------------

function embed(url: string): BlockObject {
  validateStringLength(url, LIMITS.URL, 'URL');
  return {
    object: 'block',
    type: 'embed',
    embed: { url },
  };
}

function bookmark(url: string, options?: { caption?: RichTextInput }): BlockObject {
  validateStringLength(url, LIMITS.URL, 'URL');
  return {
    object: 'block',
    type: 'bookmark',
    bookmark: {
      url,
      caption: options?.caption ? resolveRichText(options.caption) : [],
    },
  };
}

function linkPreview(url: string): BlockObject {
  validateStringLength(url, LIMITS.URL, 'URL');
  return {
    object: 'block',
    type: 'link_preview',
    link_preview: { url },
  };
}

// ---------------------------------------------------------------------------
// Structural blocks
// ---------------------------------------------------------------------------

function divider(): BlockObject {
  return {
    object: 'block',
    type: 'divider',
    divider: {},
  };
}

function breadcrumb(): BlockObject {
  return {
    object: 'block',
    type: 'breadcrumb',
    breadcrumb: {},
  };
}

function tableOfContents(options?: { color?: NotionColor }): BlockObject {
  return {
    object: 'block',
    type: 'table_of_contents',
    table_of_contents: { color: options?.color ?? 'default' },
  };
}

/** Options for table blocks. */
interface TableOptions {
  hasColumnHeader?: boolean;
  hasRowHeader?: boolean;
  children?: unknown[];
}

function table(width: number, options?: TableOptions): BlockObject {
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: width,
      has_column_header: options?.hasColumnHeader ?? false,
      has_row_header: options?.hasRowHeader ?? false,
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

function tableRow(cells: RichTextInput[]): BlockObject {
  return {
    object: 'block',
    type: 'table_row',
    table_row: {
      cells: cells.map((cell) => resolveRichText(cell)),
    },
  };
}

function columnList(columns: unknown[][]): BlockObject {
  return {
    object: 'block',
    type: 'column_list',
    column_list: {
      children: columns.map((children) => ({
        object: 'block',
        type: 'column',
        column: { children },
      })),
    },
  };
}

function column(children: unknown[]): BlockObject {
  return {
    object: 'block',
    type: 'column',
    column: { children },
  };
}

// ---------------------------------------------------------------------------
// Synced blocks
// ---------------------------------------------------------------------------

/**
 * Create a synced block.
 *
 * - Without `syncedFrom`: creates a new original synced block.
 * - With `syncedFrom`: creates a reference to an existing synced block.
 */
function syncedBlock(options?: { syncedFrom?: string; children?: unknown[] }): BlockObject {
  return {
    object: 'block',
    type: 'synced_block',
    synced_block: {
      synced_from: options?.syncedFrom ? { type: 'block_id', block_id: options.syncedFrom } : null,
      ...(options?.children ? { children: options.children } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Factory functions for constructing Notion block objects.
 *
 * Every function returns a plain object ready to pass to
 * `blocks.children.append()` or `pages.create()`.
 *
 * @example
 * ```ts
 * import { block, richText } from '@visus-io/notion-sdk-ts';
 *
 * const children = [
 *   block.heading1('My Page'),
 *   block.paragraph('Some introductory text.'),
 *   block.paragraph(richText('Bold intro').bold()),
 *   block.toDo('First task', { checked: true }),
 *   block.toDo('Second task'),
 *   block.code('console.log("hi")', 'typescript'),
 *   block.divider(),
 *   block.quote('A wise saying'),
 *   block.image('https://example.com/photo.png'),
 *   block.table(2, {
 *     hasColumnHeader: true,
 *     children: [
 *       block.tableRow(['Name', 'Value']),
 *       block.tableRow(['Alpha', '1']),
 *     ],
 *   }),
 * ];
 * ```
 */
export const block = {
  // Text blocks
  paragraph,
  heading1,
  heading2,
  heading3,
  bulletedListItem,
  numberedListItem,
  toDo,
  toggle,
  quote,
  callout,
  template,

  // Code & equation
  code,
  equation,

  // Media
  image,
  video,
  audio,
  file,
  pdf,

  // Embed
  embed,
  bookmark,
  linkPreview,

  // Structural
  divider,
  breadcrumb,
  tableOfContents,
  table,
  tableRow,
  columnList,
  column,

  // Synced
  syncedBlock,
};
