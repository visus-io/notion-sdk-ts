// ---------------------------------------------------------------------------
// Filter value types
// ---------------------------------------------------------------------------

/** A complete filter condition ready to pass to `databases.query()`. */
type FilterCondition = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Property filter builders
// ---------------------------------------------------------------------------

/** Operators common to text-like properties (title, rich_text, url, email, phone_number). */
class TextFilter {
  /**
   * @param property - The property name.
   * @param propertyType - The property-filter key (for example `rich_text`, `title`, `url`).
   * @param isFormula - When `true`, wrap the condition as `formula: { string: ... }`.
   */
  constructor(
    private readonly property: string,
    private readonly propertyType: string,
    private readonly isFormula = false,
  ) {}

  private build(condition: Record<string, unknown>): FilterCondition {
    if (this.isFormula) {
      return { property: this.property, formula: { string: condition } };
    }
    return { property: this.property, [this.propertyType]: condition };
  }

  equals(value: string): FilterCondition {
    return this.build({ equals: value });
  }

  doesNotEqual(value: string): FilterCondition {
    return this.build({ does_not_equal: value });
  }

  contains(value: string): FilterCondition {
    return this.build({ contains: value });
  }

  doesNotContain(value: string): FilterCondition {
    return this.build({ does_not_contain: value });
  }

  startsWith(value: string): FilterCondition {
    return this.build({ starts_with: value });
  }

  endsWith(value: string): FilterCondition {
    return this.build({ ends_with: value });
  }

  isEmpty(): FilterCondition {
    return this.build({ is_empty: true });
  }

  isNotEmpty(): FilterCondition {
    return this.build({ is_not_empty: true });
  }
}

/** Operators for number properties. */
class NumberFilter {
  /**
   * @param property - The property name.
   * @param isFormula - When `true`, wrap the condition as `formula: { number: ... }`.
   */
  constructor(
    private readonly property: string,
    private readonly isFormula = false,
  ) {}

  private build(condition: Record<string, unknown>): FilterCondition {
    if (this.isFormula) {
      return { property: this.property, formula: { number: condition } };
    }
    return { property: this.property, number: condition };
  }

  equals(value: number): FilterCondition {
    return this.build({ equals: value });
  }

  doesNotEqual(value: number): FilterCondition {
    return this.build({ does_not_equal: value });
  }

  greaterThan(value: number): FilterCondition {
    return this.build({ greater_than: value });
  }

  greaterThanOrEqualTo(value: number): FilterCondition {
    return this.build({ greater_than_or_equal_to: value });
  }

  lessThan(value: number): FilterCondition {
    return this.build({ less_than: value });
  }

  lessThanOrEqualTo(value: number): FilterCondition {
    return this.build({ less_than_or_equal_to: value });
  }

  isEmpty(): FilterCondition {
    return this.build({ is_empty: true });
  }

  isNotEmpty(): FilterCondition {
    return this.build({ is_not_empty: true });
  }
}

/** Operators for checkbox properties. */
class CheckboxFilter {
  /**
   * @param property - The property name.
   * @param isFormula - When `true`, wrap the condition as `formula: { checkbox: ... }`.
   */
  constructor(
    private readonly property: string,
    private readonly isFormula = false,
  ) {}

  private build(condition: Record<string, unknown>): FilterCondition {
    if (this.isFormula) {
      return { property: this.property, formula: { checkbox: condition } };
    }
    return { property: this.property, checkbox: condition };
  }

  equals(value: boolean): FilterCondition {
    return this.build({ equals: value });
  }

  doesNotEqual(value: boolean): FilterCondition {
    return this.build({ does_not_equal: value });
  }
}

/** Operators for select properties. */
class SelectFilter {
  constructor(private readonly property: string) {}

  equals(value: string): FilterCondition {
    return { property: this.property, select: { equals: value } };
  }

  doesNotEqual(value: string): FilterCondition {
    return { property: this.property, select: { does_not_equal: value } };
  }

  isEmpty(): FilterCondition {
    return { property: this.property, select: { is_empty: true } };
  }

  isNotEmpty(): FilterCondition {
    return { property: this.property, select: { is_not_empty: true } };
  }
}

/** Operators for multi-select properties. */
class MultiSelectFilter {
  constructor(private readonly property: string) {}

  contains(value: string): FilterCondition {
    return { property: this.property, multi_select: { contains: value } };
  }

  doesNotContain(value: string): FilterCondition {
    return { property: this.property, multi_select: { does_not_contain: value } };
  }

  isEmpty(): FilterCondition {
    return { property: this.property, multi_select: { is_empty: true } };
  }

  isNotEmpty(): FilterCondition {
    return { property: this.property, multi_select: { is_not_empty: true } };
  }
}

/** Operators for status properties. */
class StatusFilter {
  constructor(private readonly property: string) {}

  equals(value: string): FilterCondition {
    return { property: this.property, status: { equals: value } };
  }

  doesNotEqual(value: string): FilterCondition {
    return { property: this.property, status: { does_not_equal: value } };
  }

  isEmpty(): FilterCondition {
    return { property: this.property, status: { is_empty: true } };
  }

  isNotEmpty(): FilterCondition {
    return { property: this.property, status: { is_not_empty: true } };
  }
}

/** Operators for date properties and timestamp filters. */
class DateFilter {
  /**
   * @param key - The property name, or the timestamp name (`created_time` / `last_edited_time`).
   * @param isTimestamp - When `true`, build a `timestamp` filter instead of a `property` filter.
   * @param isFormula - When `true`, wrap the condition as `formula: { date: ... }`.
   */
  constructor(
    private readonly key: string,
    private readonly isTimestamp: boolean,
    private readonly isFormula = false,
  ) {}

  private wrap(condition: Record<string, unknown>): FilterCondition {
    if (this.isFormula) {
      return { property: this.key, formula: { date: condition } };
    }
    if (this.isTimestamp) {
      return { timestamp: this.key, [this.key]: condition };
    }
    return { property: this.key, date: condition };
  }

  equals(value: string): FilterCondition {
    return this.wrap({ equals: value });
  }

  before(value: string): FilterCondition {
    return this.wrap({ before: value });
  }

  after(value: string): FilterCondition {
    return this.wrap({ after: value });
  }

  onOrBefore(value: string): FilterCondition {
    return this.wrap({ on_or_before: value });
  }

  onOrAfter(value: string): FilterCondition {
    return this.wrap({ on_or_after: value });
  }

  pastWeek(): FilterCondition {
    return this.wrap({ past_week: {} });
  }

  pastMonth(): FilterCondition {
    return this.wrap({ past_month: {} });
  }

  pastYear(): FilterCondition {
    return this.wrap({ past_year: {} });
  }

  nextWeek(): FilterCondition {
    return this.wrap({ next_week: {} });
  }

  nextMonth(): FilterCondition {
    return this.wrap({ next_month: {} });
  }

  nextYear(): FilterCondition {
    return this.wrap({ next_year: {} });
  }

  isEmpty(): FilterCondition {
    return this.wrap({ is_empty: true });
  }

  isNotEmpty(): FilterCondition {
    return this.wrap({ is_not_empty: true });
  }
}

/** Operators for people properties. */
class PeopleFilter {
  constructor(private readonly property: string) {}

  contains(userId: string): FilterCondition {
    return { property: this.property, people: { contains: userId } };
  }

  doesNotContain(userId: string): FilterCondition {
    return { property: this.property, people: { does_not_contain: userId } };
  }

  isEmpty(): FilterCondition {
    return { property: this.property, people: { is_empty: true } };
  }

  isNotEmpty(): FilterCondition {
    return { property: this.property, people: { is_not_empty: true } };
  }
}

/** Operators for relation properties. */
class RelationFilter {
  constructor(private readonly property: string) {}

  contains(pageId: string): FilterCondition {
    return { property: this.property, relation: { contains: pageId } };
  }

  doesNotContain(pageId: string): FilterCondition {
    return { property: this.property, relation: { does_not_contain: pageId } };
  }

  isEmpty(): FilterCondition {
    return { property: this.property, relation: { is_empty: true } };
  }

  isNotEmpty(): FilterCondition {
    return { property: this.property, relation: { is_not_empty: true } };
  }
}

/** Operators for files properties. */
class FilesFilter {
  constructor(private readonly property: string) {}

  isEmpty(): FilterCondition {
    return { property: this.property, files: { is_empty: true } };
  }

  isNotEmpty(): FilterCondition {
    return { property: this.property, files: { is_not_empty: true } };
  }
}

/** Operators for formula properties. */
class FormulaFilter {
  constructor(private readonly property: string) {}

  text(): TextFilter {
    return new TextFilter(this.property, 'formula', true);
  }

  number(): NumberFilter {
    return new NumberFilter(this.property, true);
  }

  checkbox(): CheckboxFilter {
    return new CheckboxFilter(this.property, true);
  }

  date(): DateFilter {
    return new DateFilter(this.property, false, true);
  }
}

// ---------------------------------------------------------------------------
// Compound filters
// ---------------------------------------------------------------------------

/**
 * Combine filters with AND logic.
 *
 * @example
 * ```ts
 * filter.and(
 *   filter.status('Status').equals('Active'),
 *   filter.select('Priority').equals('High'),
 * )
 * ```
 */
function and(...conditions: FilterCondition[]): FilterCondition {
  return { and: conditions };
}

/**
 * Combine filters with OR logic.
 *
 * @example
 * ```ts
 * filter.or(
 *   filter.date('Due').before('2025-02-01'),
 *   filter.date('Due').isEmpty(),
 * )
 * ```
 */
function or(...conditions: FilterCondition[]): FilterCondition {
  return { or: conditions };
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Chainable database filter builders for Notion's query API.
 *
 * @example
 * ```ts
 * import { filter } from '@visus-io/notion-sdk-ts';
 *
 * notion.databases.query('db-id', {
 *   filter: filter.and(
 *     filter.status('Status').equals('Active'),
 *     filter.number('Score').greaterThan(80),
 *     filter.or(
 *       filter.date('Due Date').before('2025-02-01'),
 *       filter.date('Due Date').isEmpty(),
 *     ),
 *   ),
 * });
 * ```
 *
 * @category Helpers
 */
export const filter = {
  // Property filters
  text: (property: string) => new TextFilter(property, 'rich_text'),
  title: (property: string) => new TextFilter(property, 'title'),
  url: (property: string) => new TextFilter(property, 'url'),
  email: (property: string) => new TextFilter(property, 'email'),
  phoneNumber: (property: string) => new TextFilter(property, 'phone_number'),
  number: (property: string) => new NumberFilter(property),
  checkbox: (property: string) => new CheckboxFilter(property),
  select: (property: string) => new SelectFilter(property),
  multiSelect: (property: string) => new MultiSelectFilter(property),
  status: (property: string) => new StatusFilter(property),
  date: (property: string) => new DateFilter(property, false),
  people: (property: string) => new PeopleFilter(property),
  relation: (property: string) => new RelationFilter(property),
  files: (property: string) => new FilesFilter(property),
  formula: (property: string) => new FormulaFilter(property),

  // Timestamp filters
  createdTime: () => new DateFilter('created_time', true),
  lastEditedTime: () => new DateFilter('last_edited_time', true),

  // Compound filters
  and,
  or,
};
