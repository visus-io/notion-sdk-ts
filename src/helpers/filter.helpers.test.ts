import { describe, expect, it } from 'vitest';
import { filter } from './filter.helpers';

describe('filter helpers', () => {
  // -----------------------------------------------------------------------
  // Text-like filters
  // -----------------------------------------------------------------------

  describe('text filters (rich_text, title, url, email, phoneNumber)', () => {
    it('should create a rich_text contains filter', () => {
      expect(filter.text('Name').contains('hello')).toEqual({
        property: 'Name',
        rich_text: { contains: 'hello' },
      });
    });

    it('should create a title equals filter', () => {
      expect(filter.title('Title').equals('My Page')).toEqual({
        property: 'Title',
        title: { equals: 'My Page' },
      });
    });

    it('should create a url does_not_contain filter', () => {
      expect(filter.url('Website').doesNotContain('spam')).toEqual({
        property: 'Website',
        url: { does_not_contain: 'spam' },
      });
    });

    it('should create an email starts_with filter', () => {
      expect(filter.email('Email').startsWith('admin')).toEqual({
        property: 'Email',
        email: { starts_with: 'admin' },
      });
    });

    it('should create a phone_number ends_with filter', () => {
      expect(filter.phoneNumber('Phone').endsWith('0100')).toEqual({
        property: 'Phone',
        phone_number: { ends_with: '0100' },
      });
    });

    it('should create text isEmpty/isNotEmpty filters', () => {
      expect(filter.text('Notes').isEmpty()).toEqual({
        property: 'Notes',
        rich_text: { is_empty: true },
      });
      expect(filter.text('Notes').isNotEmpty()).toEqual({
        property: 'Notes',
        rich_text: { is_not_empty: true },
      });
    });

    it('should create a does_not_equal filter', () => {
      expect(filter.text('Name').doesNotEqual('test')).toEqual({
        property: 'Name',
        rich_text: { does_not_equal: 'test' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Number filter
  // -----------------------------------------------------------------------

  describe('number filter', () => {
    it('should create equals', () => {
      expect(filter.number('Score').equals(100)).toEqual({
        property: 'Score',
        number: { equals: 100 },
      });
    });

    it('should create greaterThan', () => {
      expect(filter.number('Score').greaterThan(80)).toEqual({
        property: 'Score',
        number: { greater_than: 80 },
      });
    });

    it('should create greaterThanOrEqualTo', () => {
      expect(filter.number('Score').greaterThanOrEqualTo(80)).toEqual({
        property: 'Score',
        number: { greater_than_or_equal_to: 80 },
      });
    });

    it('should create lessThan', () => {
      expect(filter.number('Score').lessThan(50)).toEqual({
        property: 'Score',
        number: { less_than: 50 },
      });
    });

    it('should create lessThanOrEqualTo', () => {
      expect(filter.number('Score').lessThanOrEqualTo(50)).toEqual({
        property: 'Score',
        number: { less_than_or_equal_to: 50 },
      });
    });

    it('should create doesNotEqual', () => {
      expect(filter.number('Score').doesNotEqual(0)).toEqual({
        property: 'Score',
        number: { does_not_equal: 0 },
      });
    });

    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.number('Score').isEmpty()).toEqual({
        property: 'Score',
        number: { is_empty: true },
      });
      expect(filter.number('Score').isNotEmpty()).toEqual({
        property: 'Score',
        number: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Checkbox filter
  // -----------------------------------------------------------------------

  describe('checkbox filter', () => {
    it('should create equals true', () => {
      expect(filter.checkbox('Done').equals(true)).toEqual({
        property: 'Done',
        checkbox: { equals: true },
      });
    });

    it('should create doesNotEqual', () => {
      expect(filter.checkbox('Done').doesNotEqual(false)).toEqual({
        property: 'Done',
        checkbox: { does_not_equal: false },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Select filter
  // -----------------------------------------------------------------------

  describe('select filter', () => {
    it('should create equals', () => {
      expect(filter.select('Priority').equals('High')).toEqual({
        property: 'Priority',
        select: { equals: 'High' },
      });
    });

    it('should create doesNotEqual', () => {
      expect(filter.select('Priority').doesNotEqual('Low')).toEqual({
        property: 'Priority',
        select: { does_not_equal: 'Low' },
      });
    });

    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.select('Priority').isEmpty()).toEqual({
        property: 'Priority',
        select: { is_empty: true },
      });
      expect(filter.select('Priority').isNotEmpty()).toEqual({
        property: 'Priority',
        select: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Multi-select filter
  // -----------------------------------------------------------------------

  describe('multiSelect filter', () => {
    it('should create contains', () => {
      expect(filter.multiSelect('Tags').contains('urgent')).toEqual({
        property: 'Tags',
        multi_select: { contains: 'urgent' },
      });
    });

    it('should create doesNotContain', () => {
      expect(filter.multiSelect('Tags').doesNotContain('archive')).toEqual({
        property: 'Tags',
        multi_select: { does_not_contain: 'archive' },
      });
    });

    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.multiSelect('Tags').isEmpty()).toEqual({
        property: 'Tags',
        multi_select: { is_empty: true },
      });
      expect(filter.multiSelect('Tags').isNotEmpty()).toEqual({
        property: 'Tags',
        multi_select: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Status filter
  // -----------------------------------------------------------------------

  describe('status filter', () => {
    it('should create equals', () => {
      expect(filter.status('Status').equals('Active')).toEqual({
        property: 'Status',
        status: { equals: 'Active' },
      });
    });

    it('should create doesNotEqual', () => {
      expect(filter.status('Status').doesNotEqual('Archived')).toEqual({
        property: 'Status',
        status: { does_not_equal: 'Archived' },
      });
    });

    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.status('Status').isEmpty()).toEqual({
        property: 'Status',
        status: { is_empty: true },
      });
      expect(filter.status('Status').isNotEmpty()).toEqual({
        property: 'Status',
        status: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Date filter
  // -----------------------------------------------------------------------

  describe('date filter', () => {
    it('should create equals', () => {
      expect(filter.date('Due').equals('2025-01-15')).toEqual({
        property: 'Due',
        date: { equals: '2025-01-15' },
      });
    });

    it('should create before/after', () => {
      expect(filter.date('Due').before('2025-02-01')).toEqual({
        property: 'Due',
        date: { before: '2025-02-01' },
      });
      expect(filter.date('Due').after('2025-01-01')).toEqual({
        property: 'Due',
        date: { after: '2025-01-01' },
      });
    });

    it('should create onOrBefore/onOrAfter', () => {
      expect(filter.date('Due').onOrBefore('2025-02-01')).toEqual({
        property: 'Due',
        date: { on_or_before: '2025-02-01' },
      });
      expect(filter.date('Due').onOrAfter('2025-01-01')).toEqual({
        property: 'Due',
        date: { on_or_after: '2025-01-01' },
      });
    });

    it('should create pastWeek/pastMonth/pastYear', () => {
      expect(filter.date('Due').pastWeek()).toEqual({
        property: 'Due',
        date: { past_week: {} },
      });
      expect(filter.date('Due').pastMonth()).toEqual({
        property: 'Due',
        date: { past_month: {} },
      });
      expect(filter.date('Due').pastYear()).toEqual({
        property: 'Due',
        date: { past_year: {} },
      });
    });

    it('should create nextWeek/nextMonth/nextYear', () => {
      expect(filter.date('Due').nextWeek()).toEqual({
        property: 'Due',
        date: { next_week: {} },
      });
      expect(filter.date('Due').nextMonth()).toEqual({
        property: 'Due',
        date: { next_month: {} },
      });
      expect(filter.date('Due').nextYear()).toEqual({
        property: 'Due',
        date: { next_year: {} },
      });
    });

    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.date('Due').isEmpty()).toEqual({
        property: 'Due',
        date: { is_empty: true },
      });
      expect(filter.date('Due').isNotEmpty()).toEqual({
        property: 'Due',
        date: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Timestamp filters
  // -----------------------------------------------------------------------

  describe('timestamp filters', () => {
    it('should create createdTime filter', () => {
      expect(filter.createdTime().after('2025-01-01')).toEqual({
        timestamp: 'created_time',
        created_time: { after: '2025-01-01' },
      });
    });

    it('should create lastEditedTime filter', () => {
      expect(filter.lastEditedTime().pastWeek()).toEqual({
        timestamp: 'last_edited_time',
        last_edited_time: { past_week: {} },
      });
    });
  });

  // -----------------------------------------------------------------------
  // People filter
  // -----------------------------------------------------------------------

  describe('people filter', () => {
    it('should create contains', () => {
      expect(filter.people('Assignee').contains('user-123')).toEqual({
        property: 'Assignee',
        people: { contains: 'user-123' },
      });
    });

    it('should create doesNotContain', () => {
      expect(filter.people('Assignee').doesNotContain('user-456')).toEqual({
        property: 'Assignee',
        people: { does_not_contain: 'user-456' },
      });
    });

    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.people('Assignee').isEmpty()).toEqual({
        property: 'Assignee',
        people: { is_empty: true },
      });
      expect(filter.people('Assignee').isNotEmpty()).toEqual({
        property: 'Assignee',
        people: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Relation filter
  // -----------------------------------------------------------------------

  describe('relation filter', () => {
    it('should create contains', () => {
      expect(filter.relation('Project').contains('page-123')).toEqual({
        property: 'Project',
        relation: { contains: 'page-123' },
      });
    });

    it('should create doesNotContain', () => {
      expect(filter.relation('Project').doesNotContain('page-456')).toEqual({
        property: 'Project',
        relation: { does_not_contain: 'page-456' },
      });
    });

    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.relation('Project').isEmpty()).toEqual({
        property: 'Project',
        relation: { is_empty: true },
      });
      expect(filter.relation('Project').isNotEmpty()).toEqual({
        property: 'Project',
        relation: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Files filter
  // -----------------------------------------------------------------------

  describe('files filter', () => {
    it('should create isEmpty/isNotEmpty', () => {
      expect(filter.files('Attachments').isEmpty()).toEqual({
        property: 'Attachments',
        files: { is_empty: true },
      });
      expect(filter.files('Attachments').isNotEmpty()).toEqual({
        property: 'Attachments',
        files: { is_not_empty: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Formula filter
  // -----------------------------------------------------------------------

  describe('formula filter', () => {
    it('should delegate to text sub-filter', () => {
      expect(filter.formula('Computed').text().contains('abc')).toEqual({
        property: 'Computed',
        formula: { contains: 'abc' },
      });
    });

    it('should delegate to checkbox sub-filter', () => {
      expect(filter.formula('IsActive').checkbox().equals(true)).toEqual({
        property: 'IsActive',
        checkbox: { equals: true },
      });
    });

    it('should delegate to number sub-filter', () => {
      expect(filter.formula('Score').number().greaterThan(50)).toEqual({
        property: 'Score',
        number: { greater_than: 50 },
      });
    });

    it('should delegate to date sub-filter', () => {
      expect(filter.formula('ComputedDate').date().before('2025-01-01')).toEqual({
        property: 'ComputedDate',
        date: { before: '2025-01-01' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Compound filters
  // -----------------------------------------------------------------------

  describe('compound filters', () => {
    it('should create an AND filter', () => {
      const result = filter.and(
        filter.status('Status').equals('Active'),
        filter.number('Score').greaterThan(80),
      );
      expect(result).toEqual({
        and: [
          { property: 'Status', status: { equals: 'Active' } },
          { property: 'Score', number: { greater_than: 80 } },
        ],
      });
    });

    it('should create an OR filter', () => {
      const result = filter.or(
        filter.date('Due').before('2025-02-01'),
        filter.date('Due').isEmpty(),
      );
      expect(result).toEqual({
        or: [
          { property: 'Due', date: { before: '2025-02-01' } },
          { property: 'Due', date: { is_empty: true } },
        ],
      });
    });

    it('should nest AND inside OR', () => {
      const result = filter.or(
        filter.and(
          filter.status('Status').equals('Active'),
          filter.select('Priority').equals('High'),
        ),
        filter.checkbox('Urgent').equals(true),
      );
      expect(result).toEqual({
        or: [
          {
            and: [
              { property: 'Status', status: { equals: 'Active' } },
              { property: 'Priority', select: { equals: 'High' } },
            ],
          },
          { property: 'Urgent', checkbox: { equals: true } },
        ],
      });
    });
  });
});
