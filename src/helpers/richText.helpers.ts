import type {
  EquationRichText,
  MentionRichText,
  NotionColor,
  NotionRichText,
  NotionUser,
  TextRichText,
} from '../schemas';
import { LIMITS, validateStringLength } from '../validation';

/**
 * Default annotations object with no formatting applied.
 */
const DEFAULT_ANNOTATIONS: TextRichText['annotations'] = {
  bold: false,
  italic: false,
  strikethrough: false,
  underline: false,
  code: false,
  color: 'default',
};

/**
 * A chainable builder for constructing a single Notion rich text segment.
 *
 * Do not instantiate directly — use the {@link richText} factory function or
 * the static helpers on it (`richText.mentionPage`, `richText.equation`, etc.).
 *
 * Call `.build()` to produce a `NotionRichText` array (single-element),
 * or pass builders directly to `richText.join()` which calls `.build()` for you.
 *
 * @example
 * ```ts
 * // Simple text
 * richText('Hello world').build();
 *
 * // Chained annotations
 * richText('Important').bold().italic().color('red').build();
 *
 * // Link
 * richText('Notion').link('https://notion.so').build();
 *
 * // Combine segments
 * richText.join(
 *   richText('Hello '),
 *   richText('world').bold(),
 *   richText('!'),
 * );
 * ```
 */
export class RichTextBuilder {
  /** @internal */
  protected annotations: TextRichText['annotations'] = { ...DEFAULT_ANNOTATIONS };

  /** @internal */
  protected readonly segment: NotionRichText[number];

  /** @internal */
  constructor(segment: NotionRichText[number]) {
    this.segment = segment;
    // Copy existing annotations so mutations don't affect the original
    this.annotations = { ...segment.annotations };
  }

  /** Apply bold formatting. */
  bold(): this {
    this.annotations.bold = true;
    return this;
  }

  /** Apply italic formatting. */
  italic(): this {
    this.annotations.italic = true;
    return this;
  }

  /** Apply strikethrough formatting. */
  strikethrough(): this {
    this.annotations.strikethrough = true;
    return this;
  }

  /** Apply underline formatting. */
  underline(): this {
    this.annotations.underline = true;
    return this;
  }

  /** Apply inline code formatting. */
  code(): this {
    this.annotations.code = true;
    return this;
  }

  /** Set the text color. */
  color(value: NotionColor): this {
    this.annotations.color = value;
    return this;
  }

  /**
   * Add a link to a text segment. Only applies to text-type rich text.
   * For mention or equation types, this is a no-op.
   */
  link(url: string): this {
    validateStringLength(url, LIMITS.RICH_TEXT_LINK_URL, 'Rich text link URL');
    if (this.segment.type === 'text') {
      this.segment.text.link = { url };
      this.segment.href = url;
    }
    return this;
  }

  /**
   * Build a single-element `NotionRichText` array from this builder.
   */
  build(): NotionRichText {
    return [{ ...this.segment, annotations: { ...this.annotations } }];
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Create a rich text builder for a plain text segment.
 *
 * @example
 * ```ts
 * richText('Hello').bold().build();
 * // => [{ type: 'text', text: { content: 'Hello', link: null }, ... }]
 * ```
 */
function createRichText(content: string): RichTextBuilder {
  validateStringLength(content, LIMITS.RICH_TEXT_CONTENT, 'Rich text content');

  const segment: TextRichText = {
    type: 'text',
    text: { content, link: null },
    annotations: { ...DEFAULT_ANNOTATIONS },
    plain_text: content,
    href: null,
  };
  return new RichTextBuilder(segment);
}

// ---------------------------------------------------------------------------
// Static helpers attached to the factory function
// ---------------------------------------------------------------------------

/**
 * Create a mention of a Notion page.
 */
function mentionPage(pageId: string): RichTextBuilder {
  const segment: MentionRichText = {
    type: 'mention',
    mention: { type: 'page', page: { id: pageId } },
    annotations: { ...DEFAULT_ANNOTATIONS },
    plain_text: pageId,
    href: null,
  };
  return new RichTextBuilder(segment);
}

/**
 * Create a mention of a Notion database.
 */
function mentionDatabase(databaseId: string): RichTextBuilder {
  const segment: MentionRichText = {
    type: 'mention',
    mention: { type: 'database', database: { id: databaseId } },
    annotations: { ...DEFAULT_ANNOTATIONS },
    plain_text: databaseId,
    href: null,
  };
  return new RichTextBuilder(segment);
}

/**
 * Create a mention of a Notion user.
 *
 * @param user - A full or partial Notion user object (must have at least `object` and `id`).
 */
function mentionUser(user: NotionUser): RichTextBuilder {
  const segment: MentionRichText = {
    type: 'mention',
    mention: { type: 'user', user },
    annotations: { ...DEFAULT_ANNOTATIONS },
    plain_text: 'name' in user && user.name ? user.name : user.id,
    href: null,
  };
  return new RichTextBuilder(segment);
}

/**
 * Create a date mention.
 *
 * @param start - ISO 8601 date string.
 * @param options - Optional `end` date and `time_zone`.
 */
function mentionDate(
  start: string,
  options?: { end?: string | null; time_zone?: string | null },
): RichTextBuilder {
  const segment: MentionRichText = {
    type: 'mention',
    mention: {
      type: 'date',
      date: {
        start,
        end: options?.end ?? null,
        time_zone: options?.time_zone ?? null,
      },
    },
    annotations: { ...DEFAULT_ANNOTATIONS },
    plain_text: start,
    href: null,
  };
  return new RichTextBuilder(segment);
}

/**
 * Create a link preview mention.
 */
function mentionLinkPreview(url: string): RichTextBuilder {
  const segment: MentionRichText = {
    type: 'mention',
    mention: { type: 'link_preview', link_preview: { url } },
    annotations: { ...DEFAULT_ANNOTATIONS },
    plain_text: url,
    href: url,
  };
  return new RichTextBuilder(segment);
}

/**
 * Create an equation (LaTeX) rich text segment.
 */
function equation(expression: string): RichTextBuilder {
  validateStringLength(expression, LIMITS.EQUATION_EXPRESSION, 'Equation expression');

  const segment: EquationRichText = {
    type: 'equation',
    equation: { expression },
    annotations: { ...DEFAULT_ANNOTATIONS },
    plain_text: expression,
    href: null,
  };
  return new RichTextBuilder(segment);
}

/**
 * Combine multiple rich text builders (or pre-built `NotionRichText` arrays)
 * into a single `NotionRichText` array.
 *
 * @example
 * ```ts
 * richText.join(
 *   richText('Hello '),
 *   richText('world').bold(),
 *   richText('!'),
 * );
 * ```
 */
function join(...parts: Array<RichTextBuilder | NotionRichText>): NotionRichText {
  const result: NotionRichText = [];
  for (const part of parts) {
    if (part instanceof RichTextBuilder) {
      result.push(...part.build());
    } else {
      result.push(...part);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Assemble the public `richText` export
// ---------------------------------------------------------------------------

/**
 * Factory function for creating Notion rich text, with static helpers for
 * mentions, equations, and joining multiple segments.
 *
 * @example
 * ```ts
 * // Plain text with annotations
 * richText('Hello').bold().build();
 *
 * // Mentions
 * richText.mentionPage('abc-123').build();
 * richText.mentionUser({ object: 'user', id: 'abc-123' }).build();
 *
 * // Equation
 * richText.equation('E=mc^2').build();
 *
 * // Combine multiple segments
 * richText.join(
 *   richText('Normal '),
 *   richText('bold').bold(),
 *   richText(' and '),
 *   richText('italic').italic(),
 * );
 * ```
 */
export const richText = Object.assign(createRichText, {
  mentionPage,
  mentionDatabase,
  mentionUser,
  mentionDate,
  mentionLinkPreview,
  equation,
  join,
});
