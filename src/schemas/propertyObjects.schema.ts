import * as z from 'zod';

/**
 * Data source property objects define the schema and configuration for a data source.
 * Page property values contain the actual data instead.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/property-object
 */

/** Valid color values for select, multi_select, and status options */
const colorSchema = z.enum([
  'blue',
  'brown',
  'default',
  'gray',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'yellow',
]);

/** Option for select and multi_select properties */
const selectOptionSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  color: colorSchema,
});

/** Checkbox property configuration (empty object) */
const checkboxPropertySchema = z.object({
  type: z.literal('checkbox'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  checkbox: z.object({}),
});

/** Created by property configuration (empty object) */
const createdByPropertySchema = z.object({
  type: z.literal('created_by'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  created_by: z.object({}),
});

/** Created time property configuration (empty object) */
const createdTimePropertySchema = z.object({
  type: z.literal('created_time'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  created_time: z.object({}),
});

/** Date property configuration (empty object) */
const datePropertySchema = z.object({
  type: z.literal('date'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  date: z.object({}),
});

/** Email property configuration (empty object) */
const emailPropertySchema = z.object({
  type: z.literal('email'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  email: z.object({}),
});

/** Files property configuration (empty object) */
const filesPropertySchema = z.object({
  type: z.literal('files'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  files: z.object({}),
});

/** Formula property configuration */
const formulaPropertySchema = z.object({
  type: z.literal('formula'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  formula: z.object({
    expression: z.string().trim(),
  }),
});

/** Last edited by property configuration (empty object) */
const lastEditedByPropertySchema = z.object({
  type: z.literal('last_edited_by'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  last_edited_by: z.object({}),
});

/** Last edited time property configuration (empty object) */
const lastEditedTimePropertySchema = z.object({
  type: z.literal('last_edited_time'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  last_edited_time: z.object({}),
});

/** Multi-select property configuration */
const multiSelectPropertySchema = z.object({
  type: z.literal('multi_select'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  multi_select: z.object({
    options: z.array(selectOptionSchema),
  }),
});

/** Number format options */
const numberFormatSchema = z.enum([
  'argentine_peso',
  'baht',
  'australian_dollar',
  'canadian_dollar',
  'chilean_peso',
  'colombian_peso',
  'danish_krone',
  'dirham',
  'dollar',
  'euro',
  'forint',
  'franc',
  'hong_kong_dollar',
  'koruna',
  'krona',
  'leu',
  'lira',
  'mexican_peso',
  'new_taiwan_dollar',
  'new_zealand_dollar',
  'norwegian_krone',
  'number',
  'number_with_commas',
  'percent',
  'philippine_peso',
  'pound',
  'peruvian_sol',
  'rand',
  'real',
  'ringgit',
  'riyal',
  'ruble',
  'rupee',
  'rupiah',
  'shekel',
  'singapore_dollar',
  'uruguayan_peso',
  'yen',
  'yuan',
  'won',
  'zloty',
]);

/** Number property configuration */
const numberPropertySchema = z.object({
  type: z.literal('number'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  number: z.object({
    format: numberFormatSchema,
  }),
});

/** People property configuration (empty object) */
const peoplePropertySchema = z.object({
  type: z.literal('people'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  people: z.object({}),
});

/** Phone number property configuration (empty object) */
const phoneNumberPropertySchema = z.object({
  type: z.literal('phone_number'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  phone_number: z.object({}),
});

/** Place property configuration (empty object) */
const placePropertySchema = z.object({
  type: z.literal('place'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  place: z.object({}),
});

/** Relation property configuration */
const relationPropertySchema = z.object({
  type: z.literal('relation'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  relation: z.object({
    data_source_id: z.uuid(),
    synced_property_id: z.string().trim(),
    synced_property_name: z.string().trim(),
  }),
});

/** Rich text property configuration (empty object) */
const richTextPropertySchema = z.object({
  type: z.literal('rich_text'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  rich_text: z.object({}),
});

/** Rollup function options */
const rollupFunctionSchema = z.enum([
  'average',
  'checked',
  'count_per_group',
  'count',
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
  'unchecked',
  'unique',
  'show_original',
  'show_unique',
  'sum',
]);

/** Rollup property configuration */
const rollupPropertySchema = z.object({
  type: z.literal('rollup'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  rollup: z.object({
    rollup_property_name: z.string().trim(),
    relation_property_name: z.string().trim(),
    rollup_property_id: z.string().trim(),
    relation_property_id: z.string().trim(),
    function: rollupFunctionSchema,
  }),
});

/** Select property configuration */
const selectPropertySchema = z.object({
  type: z.literal('select'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  select: z.object({
    options: z.array(selectOptionSchema),
  }),
});

/** Status option for status properties */
const statusOptionSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  color: colorSchema,
});

/** Status group for status properties */
const statusGroupSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  color: colorSchema,
  option_ids: z.array(z.string().trim()),
});

/** Status property configuration */
const statusPropertySchema = z.object({
  type: z.literal('status'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  status: z.object({
    options: z.array(statusOptionSchema),
    groups: z.array(statusGroupSchema),
  }),
});

/** Title property configuration (empty object). Every data source requires exactly one. */
const titlePropertySchema = z.object({
  type: z.literal('title'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  title: z.object({}),
});

/** URL property configuration (empty object) */
const urlPropertySchema = z.object({
  type: z.literal('url'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  url: z.object({}),
});

/** Unique ID property configuration */
const uniqueIdPropertySchema = z.object({
  type: z.literal('unique_id'),
  id: z.string().trim(),
  name: z.string().trim(),
  description: z.string().trim().optional(),
  unique_id: z.object({
    prefix: z.string().trim().optional(),
  }),
});

/**
 * Discriminated union of all data source property object types.
 * Together they define the configuration for a data source, not the values.
 *
 * @category Page Properties
 */
export const propertyObjectSchema = z.discriminatedUnion('type', [
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
  placePropertySchema,
  relationPropertySchema,
  richTextPropertySchema,
  rollupPropertySchema,
  selectPropertySchema,
  statusPropertySchema,
  titlePropertySchema,
  urlPropertySchema,
  uniqueIdPropertySchema,
]);

/**
 * Record of property objects keyed by property name.
 *
 * @category Page Properties
 */
export const propertiesObjectSchema = z.record(z.string().trim(), propertyObjectSchema);

/**
 * @category Page Properties
 */
export type NotionPropertyObject = z.infer<typeof propertyObjectSchema>;
/**
 * @category Page Properties
 */
export type NotionPropertiesObject = z.infer<typeof propertiesObjectSchema>;

// Export individual property types for convenience
/**
 * @category Page Properties
 */
export type CheckboxPropertyObject = z.infer<typeof checkboxPropertySchema>;
/**
 * @category Page Properties
 */
export type CreatedByPropertyObject = z.infer<typeof createdByPropertySchema>;
/**
 * @category Page Properties
 */
export type CreatedTimePropertyObject = z.infer<typeof createdTimePropertySchema>;
/**
 * @category Page Properties
 */
export type DatePropertyObject = z.infer<typeof datePropertySchema>;
/**
 * @category Page Properties
 */
export type EmailPropertyObject = z.infer<typeof emailPropertySchema>;
/**
 * @category Page Properties
 */
export type FilesPropertyObject = z.infer<typeof filesPropertySchema>;
/**
 * @category Page Properties
 */
export type FormulaPropertyObject = z.infer<typeof formulaPropertySchema>;
/**
 * @category Page Properties
 */
export type LastEditedByPropertyObject = z.infer<typeof lastEditedByPropertySchema>;
/**
 * @category Page Properties
 */
export type LastEditedTimePropertyObject = z.infer<typeof lastEditedTimePropertySchema>;
/**
 * @category Page Properties
 */
export type MultiSelectPropertyObject = z.infer<typeof multiSelectPropertySchema>;
/**
 * @category Page Properties
 */
export type NumberPropertyObject = z.infer<typeof numberPropertySchema>;
/**
 * @category Page Properties
 */
export type PeoplePropertyObject = z.infer<typeof peoplePropertySchema>;
/**
 * @category Page Properties
 */
export type PhoneNumberPropertyObject = z.infer<typeof phoneNumberPropertySchema>;
/**
 * @category Page Properties
 */
export type PlacePropertyObject = z.infer<typeof placePropertySchema>;
/**
 * @category Page Properties
 */
export type RelationPropertyObject = z.infer<typeof relationPropertySchema>;
/**
 * @category Page Properties
 */
export type RichTextPropertyObject = z.infer<typeof richTextPropertySchema>;
/**
 * @category Page Properties
 */
export type RollupPropertyObject = z.infer<typeof rollupPropertySchema>;
/**
 * @category Page Properties
 */
export type SelectPropertyObject = z.infer<typeof selectPropertySchema>;
/**
 * @category Page Properties
 */
export type StatusPropertyObject = z.infer<typeof statusPropertySchema>;
/**
 * @category Page Properties
 */
export type TitlePropertyObject = z.infer<typeof titlePropertySchema>;
/**
 * @category Page Properties
 */
export type UrlPropertyObject = z.infer<typeof urlPropertySchema>;
/**
 * @category Page Properties
 */
export type UniqueIdPropertyObject = z.infer<typeof uniqueIdPropertySchema>;
