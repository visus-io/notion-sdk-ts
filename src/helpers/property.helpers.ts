import type { NotionRichText } from '../schemas';
import { LIMITS, validateArrayLength, validateStringLength } from '../validation';
import { RichTextBuilder } from './richText.helpers';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** Accepted rich text input for property helpers. */
type RichTextInput = string | RichTextBuilder | NotionRichText;

/** Resolve rich text input to a `NotionRichText` array. */
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

// ---------------------------------------------------------------------------
// Property value helpers
// ---------------------------------------------------------------------------

/**
 * Create a title property value.
 *
 * @example
 * ```ts
 * prop.title('My Page')
 * prop.title(richText('Bold Title').bold())
 * ```
 */
function title(text: RichTextInput): { title: NotionRichText } {
  return { title: resolveRichText(text) };
}

/**
 * Create a rich text property value.
 *
 * @example
 * ```ts
 * prop.richText('Some notes')
 * prop.richText(richText('Formatted').italic())
 * ```
 */
function richTextProp(text: RichTextInput): { rich_text: NotionRichText } {
  return { rich_text: resolveRichText(text) };
}

/**
 * Create a number property value.
 *
 * @example
 * ```ts
 * prop.number(42)
 * prop.number(null) // clear the value
 * ```
 */
function number(value: number | null): { number: number | null } {
  return { number: value };
}

/**
 * Create a checkbox property value.
 *
 * @example
 * ```ts
 * prop.checkbox(true)
 * ```
 */
function checkbox(checked: boolean): { checkbox: boolean } {
  return { checkbox: checked };
}

/**
 * Create a select property value.
 *
 * @example
 * ```ts
 * prop.select('Option A')
 * prop.select(null) // clear the selection
 * ```
 */
function select(name: string | null): { select: { name: string } | null } {
  return { select: name !== null ? { name } : null };
}

/**
 * Create a multi-select property value.
 *
 * @example
 * ```ts
 * prop.multiSelect(['Tag1', 'Tag2'])
 * ```
 */
function multiSelect(names: string[]): { multi_select: Array<{ name: string }> } {
  validateArrayLength(names, LIMITS.MULTI_SELECT, 'Multi-select options');
  return { multi_select: names.map((name) => ({ name })) };
}

/**
 * Create a status property value.
 *
 * @example
 * ```ts
 * prop.status('In Progress')
 * prop.status(null) // clear the status
 * ```
 */
function status(name: string | null): { status: { name: string } | null } {
  return { status: name !== null ? { name } : null };
}

/** Options for date properties. */
interface DateOptions {
  end?: string | null;
  timeZone?: string | null;
}

/** The shape of a date property value. */
interface DateValue {
  date: { start: string; end: string | null; time_zone: string | null } | null;
}

/**
 * Create a date property value.
 *
 * @param start - ISO 8601 date or datetime string.
 * @param options - Optional end date and time zone.
 *
 * @example
 * ```ts
 * prop.date('2025-01-15')
 * prop.date('2025-01-15', { end: '2025-01-20' })
 * prop.date('2025-01-15T09:00:00', { timeZone: 'America/New_York' })
 * prop.date(null) // clear the date
 * ```
 */
function date(start: string | null, options?: DateOptions): DateValue {
  if (start === null) {
    return { date: null };
  }
  return {
    date: {
      start,
      end: options?.end ?? null,
      time_zone: options?.timeZone ?? null,
    },
  };
}

/**
 * Create a URL property value.
 *
 * @example
 * ```ts
 * prop.url('https://example.com')
 * prop.url(null) // clear the URL
 * ```
 */
function url(value: string | null): { url: string | null } {
  if (value !== null) {
    validateStringLength(value, LIMITS.URL, 'URL');
  }
  return { url: value };
}

/**
 * Create an email property value.
 *
 * @example
 * ```ts
 * prop.email('user@example.com')
 * prop.email(null) // clear
 * ```
 */
function email(value: string | null): { email: string | null } {
  if (value !== null) {
    validateStringLength(value, LIMITS.EMAIL, 'Email');
  }
  return { email: value };
}

/**
 * Create a phone number property value.
 *
 * @example
 * ```ts
 * prop.phoneNumber('+1-555-0100')
 * prop.phoneNumber(null) // clear
 * ```
 */
function phoneNumber(value: string | null): { phone_number: string | null } {
  if (value !== null) {
    validateStringLength(value, LIMITS.PHONE_NUMBER, 'Phone number');
  }
  return { phone_number: value };
}

/**
 * Create a relation property value from an array of page IDs.
 *
 * @example
 * ```ts
 * prop.relation(['page-id-1', 'page-id-2'])
 * ```
 */
function relation(pageIds: string[]): { relation: Array<{ id: string }> } {
  validateArrayLength(pageIds, LIMITS.RELATION, 'Relation pages');
  return { relation: pageIds.map((id) => ({ id })) };
}

/**
 * Create a people property value from an array of user IDs.
 *
 * @example
 * ```ts
 * prop.people(['user-id-1', 'user-id-2'])
 * ```
 */
function people(userIds: string[]): { people: Array<{ object: 'user'; id: string }> } {
  validateArrayLength(userIds, LIMITS.PEOPLE, 'People');
  return { people: userIds.map((id) => ({ object: 'user' as const, id })) };
}

/** A single file entry for the files' property. */
interface FileEntry {
  name: string;
  url: string;
}

/** A single external file in the files property value. */
interface ExternalFileEntry {
  name: string;
  type: 'external';
  external: { url: string };
}

/**
 * Create a files property value.
 *
 * @example
 * ```ts
 * prop.files([{ name: 'doc.pdf', url: 'https://example.com/doc.pdf' }])
 * ```
 */
function files(entries: FileEntry[]): { files: ExternalFileEntry[] } {
  return {
    files: entries.map((entry) => ({
      name: entry.name,
      type: 'external' as const,
      external: { url: entry.url },
    })),
  };
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Factory functions for constructing page property values.
 *
 * @example
 * ```ts
 * import { prop, richText } from '@visus-io/notion-sdk-ts';
 *
 * notion.pages.create({
 *   parent: { database_id: 'db-id' },
 *   properties: {
 *     Name: prop.title('My Task'),
 *     Status: prop.status('In Progress'),
 *     Priority: prop.select('High'),
 *     'Due Date': prop.date('2025-02-01'),
 *     Score: prop.number(95),
 *     Done: prop.checkbox(false),
 *     Tags: prop.multiSelect(['urgent', 'frontend']),
 *     Assignee: prop.people(['user-id']),
 *     Notes: prop.richText(richText('Important').bold()),
 *   },
 * });
 * ```
 */
export const prop = {
  title,
  richText: richTextProp,
  number,
  checkbox,
  select,
  multiSelect,
  status,
  date,
  url,
  email,
  phoneNumber,
  relation,
  people,
  files,
};
