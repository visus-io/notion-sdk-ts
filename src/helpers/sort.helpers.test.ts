import { describe, expect, it } from 'vitest';
import { sort } from './sort.helpers';

describe('sort helpers', () => {
  describe('property sort', () => {
    it('should create ascending sort', () => {
      expect(sort.property('Name').ascending()).toEqual({
        property: 'Name',
        direction: 'ascending',
      });
    });

    it('should create descending sort', () => {
      expect(sort.property('Priority').descending()).toEqual({
        property: 'Priority',
        direction: 'descending',
      });
    });
  });

  describe('timestamp sort', () => {
    it('should sort by created_time descending', () => {
      expect(sort.createdTime().descending()).toEqual({
        timestamp: 'created_time',
        direction: 'descending',
      });
    });

    it('should sort by last_edited_time ascending', () => {
      expect(sort.lastEditedTime().ascending()).toEqual({
        timestamp: 'last_edited_time',
        direction: 'ascending',
      });
    });
  });
});
