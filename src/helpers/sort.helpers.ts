// ---------------------------------------------------------------------------
// Sort types
// ---------------------------------------------------------------------------

type SortDirection = 'ascending' | 'descending';

interface PropertySort {
  property: string;
  direction: SortDirection;
}

interface TimestampSort {
  timestamp: 'created_time' | 'last_edited_time';
  direction: SortDirection;
}

type SortObject = PropertySort | TimestampSort;

// ---------------------------------------------------------------------------
// Sort builders
// ---------------------------------------------------------------------------

class PropertySortBuilder {
  constructor(private readonly property: string) {}

  ascending(): SortObject {
    return { property: this.property, direction: 'ascending' };
  }

  descending(): SortObject {
    return { property: this.property, direction: 'descending' };
  }
}

class TimestampSortBuilder {
  constructor(private readonly timestamp: 'created_time' | 'last_edited_time') {}

  ascending(): SortObject {
    return { timestamp: this.timestamp, direction: 'ascending' };
  }

  descending(): SortObject {
    return { timestamp: this.timestamp, direction: 'descending' };
  }
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Chainable sort builders for Notion database queries.
 *
 * @example
 * ```ts
 * import { sort } from '@visus-io/notion-sdk-ts';
 *
 * notion.databases.query('db-id', {
 *   sorts: [
 *     sort.property('Priority').ascending(),
 *     sort.createdTime().descending(),
 *   ],
 * });
 * ```
 */
export const sort = {
  /**
   * Sort by a database property.
   *
   * @example
   * ```ts
   * sort.property('Name').ascending()
   * sort.property('Due Date').descending()
   * ```
   */
  property: (name: string) => new PropertySortBuilder(name),

  /**
   * Sort by creation time.
   *
   * @example
   * ```ts
   * sort.createdTime().descending()
   * ```
   */
  createdTime: () => new TimestampSortBuilder('created_time'),

  /**
   * Sort by last edited time.
   *
   * @example
   * ```ts
   * sort.lastEditedTime().ascending()
   * ```
   */
  lastEditedTime: () => new TimestampSortBuilder('last_edited_time'),
};
