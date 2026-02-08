import { z } from 'zod';
import { NOTION_COLORS } from './colors';
import { richTextSchema } from './richText.schema';
import { userSchema } from './user.schema';

/**
 * Page property value schemas.
 *
 * These define the actual data values stored in page properties (database columns).
 * Different from property objects which define the schema/configuration.
 * Supports 23 property types including title, rich text, number, select, etc.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/page-property-values
 */

/** Checkbox property. */
const checkboxPropertySchema = z.object({
  id: z.string(),
  type: z.literal('checkbox'),
  checkbox: z.boolean(),
});

/** Created by property. */
const createdByPropertySchema = z.object({
  id: z.string(),
  type: z.literal('created_by'),
  created_by: userSchema,
});

/** Created time property. */
const createdTimePropertySchema = z.object({
  id: z.string(),
  type: z.literal('created_time'),
  created_time: z.iso.datetime(),
});

/** Date property. */
const datePropertySchema = z.object({
  id: z.string(),
  type: z.literal('date'),
  date: z
    .object({
      start: z.string(),
      end: z.string().nullable(),
      time_zone: z.string().nullable(),
    })
    .nullable(),
});

/** Email property. */
const emailPropertySchema = z.object({
  id: z.string(),
  type: z.literal('email'),
  email: z.string().nullable(),
});

/** Files property. */
const filesPropertySchema = z.object({
  id: z.string(),
  type: z.literal('files'),
  files: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['external', 'file', 'file_upload']),
      external: z.object({ url: z.url() }).optional(),
      file: z.object({ url: z.url(), expiry_time: z.iso.datetime() }).optional(),
      file_upload: z.object({ id: z.uuid() }).optional(),
    }),
  ),
});

/** Formula property. */
const formulaPropertySchema = z.object({
  id: z.string(),
  type: z.literal('formula'),
  formula: z.discriminatedUnion('type', [
    z.object({ type: z.literal('boolean'), boolean: z.boolean() }),
    z.object({
      type: z.literal('date'),
      date: z.object({
        start: z.string(),
        end: z.string().nullable(),
        time_zone: z.string().nullable(),
      }),
    }),
    z.object({ type: z.literal('number'), number: z.number().nullable() }),
    z.object({ type: z.literal('string'), string: z.string().nullable() }),
  ]),
});

/** Last edited by property. */
const lastEditedByPropertySchema = z.object({
  id: z.string(),
  type: z.literal('last_edited_by'),
  last_edited_by: userSchema,
});

/** Last edited time property. */
const lastEditedTimePropertySchema = z.object({
  id: z.string(),
  type: z.literal('last_edited_time'),
  last_edited_time: z.iso.datetime(),
});

/** Multi-select property. */
const multiSelectPropertySchema = z.object({
  id: z.string(),
  type: z.literal('multi_select'),
  multi_select: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.enum(NOTION_COLORS),
    }),
  ),
});

/** Number property. */
const numberPropertySchema = z.object({
  id: z.string(),
  type: z.literal('number'),
  number: z.number().nullable(),
});

/** People property. */
const peoplePropertySchema = z.object({
  id: z.string(),
  type: z.literal('people'),
  people: z.array(userSchema),
});

/** Phone number property. */
const phoneNumberPropertySchema = z.object({
  id: z.string(),
  type: z.literal('phone_number'),
  phone_number: z.string().nullable(),
});

/** Relation property. */
const relationPropertySchema = z.object({
  id: z.string(),
  type: z.literal('relation'),
  relation: z.array(z.object({ id: z.uuid() })),
  has_more: z.boolean(),
});

/** Rich text property. */
const richTextPropertySchema = z.object({
  id: z.string(),
  type: z.literal('rich_text'),
  rich_text: richTextSchema,
});

/** Rollup property. */
const rollupPropertySchema = z.object({
  id: z.string(),
  type: z.literal('rollup'),
  rollup: z.object({
    type: z.enum(['number', 'date', 'array', 'incomplete', 'unsupported']),
    function: z.enum([
      'average',
      'checked',
      'count',
      'count_per_group',
      'count_values',
      'date_range',
      'earliest_date',
      'empty',
      'latest_date',
      'max',
      'median',
      'min',
      'not_empty',
      'percent_checked',
      'percent_empty',
      'percent_not_empty',
      'percent_per_group',
      'percent_unchecked',
      'range',
      'show_original',
      'show_unique',
      'sum',
      'unchecked',
      'unique',
    ]),
    number: z.number().nullable().optional(),
    date: z
      .object({
        start: z.string(),
        end: z.string().nullable(),
        time_zone: z.string().nullable(),
      })
      .nullable()
      .optional(),
    array: z.array(z.any()).optional(),
  }),
});

/** Select property. */
const selectPropertySchema = z.object({
  id: z.string(),
  type: z.literal('select'),
  select: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.enum(NOTION_COLORS),
    })
    .nullable(),
});

/** Status property. */
const statusPropertySchema = z.object({
  id: z.string(),
  type: z.literal('status'),
  status: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.enum(NOTION_COLORS),
    })
    .nullable(),
});

/** Title property. */
const titlePropertySchema = z.object({
  id: z.string(),
  type: z.literal('title'),
  title: richTextSchema,
});

/** URL property. */
const urlPropertySchema = z.object({
  id: z.string(),
  type: z.literal('url'),
  url: z.url().nullable(),
});

/** Unique ID property. */
const uniqueIdPropertySchema = z.object({
  id: z.string(),
  type: z.literal('unique_id'),
  unique_id: z.object({
    number: z.number().int(),
    prefix: z.string().nullable(),
  }),
});

/** Verification property. */
const verificationPropertySchema = z.object({
  id: z.string(),
  type: z.literal('verification'),
  verification: z
    .object({
      state: z.enum(['verified', 'unverified']),
      verified_by: userSchema.nullable(),
      date: z
        .object({
          start: z.string(),
          end: z.string().nullable(),
          time_zone: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
});

export const pagePropertiesSchema = z.discriminatedUnion('type', [
  checkboxPropertySchema,
  createdByPropertySchema,
  createdTimePropertySchema,
  datePropertySchema,
  emailPropertySchema,
  filesPropertySchema,
  formulaPropertySchema,
  lastEditedByPropertySchema,
  lastEditedTimePropertySchema,
  multiSelectPropertySchema,
  numberPropertySchema,
  peoplePropertySchema,
  phoneNumberPropertySchema,
  relationPropertySchema,
  richTextPropertySchema,
  rollupPropertySchema,
  selectPropertySchema,
  statusPropertySchema,
  titlePropertySchema,
  urlPropertySchema,
  uniqueIdPropertySchema,
  verificationPropertySchema,
]);

export type NotionPageProperties = z.infer<typeof pagePropertiesSchema>;
export type CheckboxProperty = z.infer<typeof checkboxPropertySchema>;
export type CreatedByProperty = z.infer<typeof createdByPropertySchema>;
export type CreatedTimeProperty = z.infer<typeof createdTimePropertySchema>;
export type DateProperty = z.infer<typeof datePropertySchema>;
export type EmailProperty = z.infer<typeof emailPropertySchema>;
export type FilesProperty = z.infer<typeof filesPropertySchema>;
export type FormulaProperty = z.infer<typeof formulaPropertySchema>;
export type LastEditedByProperty = z.infer<typeof lastEditedByPropertySchema>;
export type LastEditedTimeProperty = z.infer<typeof lastEditedTimePropertySchema>;
export type MultiSelectProperty = z.infer<typeof multiSelectPropertySchema>;
export type NumberProperty = z.infer<typeof numberPropertySchema>;
export type PeopleProperty = z.infer<typeof peoplePropertySchema>;
export type PhoneNumberProperty = z.infer<typeof phoneNumberPropertySchema>;
export type RelationProperty = z.infer<typeof relationPropertySchema>;
export type RichTextProperty = z.infer<typeof richTextPropertySchema>;
export type RollupProperty = z.infer<typeof rollupPropertySchema>;
export type SelectProperty = z.infer<typeof selectPropertySchema>;
export type StatusProperty = z.infer<typeof statusPropertySchema>;
export type TitleProperty = z.infer<typeof titlePropertySchema>;
export type UrlProperty = z.infer<typeof urlPropertySchema>;
export type UniqueIdProperty = z.infer<typeof uniqueIdPropertySchema>;
export type VerificationProperty = z.infer<typeof verificationPropertySchema>;
