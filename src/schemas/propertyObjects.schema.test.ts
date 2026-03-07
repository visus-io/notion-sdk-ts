import { describe, expect, it } from 'vitest';
import { propertyObjectSchema, propertiesObjectSchema } from './propertyObjects.schema';

describe('propertyObjectSchema', () => {
  describe('checkbox property', () => {
    it('should parse checkbox property', () => {
      const property = {
        type: 'checkbox' as const,
        id: 'prop-1',
        name: 'Is Complete',
        checkbox: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse checkbox property with description', () => {
      const property = {
        type: 'checkbox' as const,
        id: 'prop-2',
        name: 'Active',
        description: 'Whether the item is active',
        checkbox: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('created_by property', () => {
    it('should parse created_by property', () => {
      const property = {
        type: 'created_by' as const,
        id: 'prop-3',
        name: 'Created By',
        created_by: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('created_time property', () => {
    it('should parse created_time property', () => {
      const property = {
        type: 'created_time' as const,
        id: 'prop-4',
        name: 'Created Time',
        created_time: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('date property', () => {
    it('should parse date property', () => {
      const property = {
        type: 'date' as const,
        id: 'prop-5',
        name: 'Due Date',
        date: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('email property', () => {
    it('should parse email property', () => {
      const property = {
        type: 'email' as const,
        id: 'prop-6',
        name: 'Email',
        email: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('files property', () => {
    it('should parse files property', () => {
      const property = {
        type: 'files' as const,
        id: 'prop-7',
        name: 'Attachments',
        files: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('formula property', () => {
    it('should parse formula property with expression', () => {
      const property = {
        type: 'formula' as const,
        id: 'prop-8',
        name: 'Total',
        formula: {
          expression: 'prop("Price") * prop("Quantity")',
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('last_edited_by property', () => {
    it('should parse last_edited_by property', () => {
      const property = {
        type: 'last_edited_by' as const,
        id: 'prop-9',
        name: 'Last Edited By',
        last_edited_by: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('last_edited_time property', () => {
    it('should parse last_edited_time property', () => {
      const property = {
        type: 'last_edited_time' as const,
        id: 'prop-10',
        name: 'Last Edited Time',
        last_edited_time: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('multi_select property', () => {
    it('should parse multi_select property with options', () => {
      const property = {
        type: 'multi_select' as const,
        id: 'prop-11',
        name: 'Tags',
        multi_select: {
          options: [
            { id: 'opt-1', name: 'Important', color: 'red' as const },
            { id: 'opt-2', name: 'Urgent', color: 'yellow' as const },
            { id: 'opt-3', name: 'Low Priority', color: 'gray' as const },
          ],
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse multi_select with all valid colors', () => {
      const colors = [
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
      ] as const;

      colors.forEach((color) => {
        const property = {
          type: 'multi_select' as const,
          id: 'prop-multi',
          name: 'Tags',
          multi_select: {
            options: [{ id: 'opt-1', name: 'Test', color }],
          },
        };

        const result = propertyObjectSchema.safeParse(property);
        expect(result.success).toBe(true);
      });
    });

    it('should parse multi_select with empty options', () => {
      const property = {
        type: 'multi_select' as const,
        id: 'prop-12',
        name: 'Tags',
        multi_select: {
          options: [],
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('number property', () => {
    it('should parse number property with dollar format', () => {
      const property = {
        type: 'number' as const,
        id: 'prop-13',
        name: 'Price',
        number: {
          format: 'dollar' as const,
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse number property with percent format', () => {
      const property = {
        type: 'number' as const,
        id: 'prop-14',
        name: 'Completion',
        number: {
          format: 'percent' as const,
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse number property with euro format', () => {
      const property = {
        type: 'number' as const,
        id: 'prop-15',
        name: 'Amount',
        number: {
          format: 'euro' as const,
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse number with various currency formats', () => {
      const formats = [
        'argentine_peso',
        'baht',
        'australian_dollar',
        'canadian_dollar',
        'chilean_peso',
        'yen',
        'yuan',
        'won',
        'pound',
        'rupee',
      ] as const;

      formats.forEach((format) => {
        const property = {
          type: 'number' as const,
          id: 'prop-num',
          name: 'Amount',
          number: { format },
        };

        const result = propertyObjectSchema.safeParse(property);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('people property', () => {
    it('should parse people property', () => {
      const property = {
        type: 'people' as const,
        id: 'prop-16',
        name: 'Assignees',
        people: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('phone_number property', () => {
    it('should parse phone_number property', () => {
      const property = {
        type: 'phone_number' as const,
        id: 'prop-17',
        name: 'Phone',
        phone_number: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('place property', () => {
    it('should parse place property', () => {
      const property = {
        type: 'place' as const,
        id: 'prop-18',
        name: 'Location',
        place: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('relation property', () => {
    it('should parse relation property', () => {
      const property = {
        type: 'relation' as const,
        id: 'prop-19',
        name: 'Related Items',
        relation: {
          data_source_id: '123e4567-e89b-12d3-a456-426614174000',
          synced_property_id: 'sync-prop-1',
          synced_property_name: 'Related',
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should reject relation with invalid UUID', () => {
      const property = {
        type: 'relation',
        id: 'prop-20',
        name: 'Related Items',
        relation: {
          data_source_id: 'not-a-uuid',
          synced_property_id: 'sync-prop-1',
          synced_property_name: 'Related',
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(false);
    });
  });

  describe('rich_text property', () => {
    it('should parse rich_text property', () => {
      const property = {
        type: 'rich_text' as const,
        id: 'prop-21',
        name: 'Description',
        rich_text: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('rollup property', () => {
    it('should parse rollup property with sum function', () => {
      const property = {
        type: 'rollup' as const,
        id: 'prop-22',
        name: 'Total Sales',
        rollup: {
          rollup_property_name: 'Amount',
          relation_property_name: 'Orders',
          rollup_property_id: 'rollup-1',
          relation_property_id: 'rel-1',
          function: 'sum' as const,
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse rollup with all function types', () => {
      const functions = [
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
      ] as const;

      functions.forEach((func) => {
        const property = {
          type: 'rollup' as const,
          id: 'prop-rollup',
          name: 'Rollup',
          rollup: {
            rollup_property_name: 'Value',
            relation_property_name: 'Relation',
            rollup_property_id: 'r-1',
            relation_property_id: 'rel-1',
            function: func,
          },
        };

        const result = propertyObjectSchema.safeParse(property);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('select property', () => {
    it('should parse select property with options', () => {
      const property = {
        type: 'select' as const,
        id: 'prop-23',
        name: 'Status',
        select: {
          options: [
            { id: 'opt-1', name: 'Not Started', color: 'gray' as const },
            { id: 'opt-2', name: 'In Progress', color: 'yellow' as const },
            { id: 'opt-3', name: 'Done', color: 'green' as const },
          ],
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse select with empty options', () => {
      const property = {
        type: 'select' as const,
        id: 'prop-24',
        name: 'Priority',
        select: {
          options: [],
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('status property', () => {
    it('should parse status property with options and groups', () => {
      const property = {
        type: 'status' as const,
        id: 'prop-25',
        name: 'Status',
        status: {
          options: [
            { id: 'opt-1', name: 'Not Started', color: 'gray' as const },
            { id: 'opt-2', name: 'In Progress', color: 'blue' as const },
            { id: 'opt-3', name: 'Done', color: 'green' as const },
          ],
          groups: [
            { id: 'grp-1', name: 'To Do', color: 'gray' as const, option_ids: ['opt-1'] },
            {
              id: 'grp-2',
              name: 'In Progress',
              color: 'blue' as const,
              option_ids: ['opt-2'],
            },
            { id: 'grp-3', name: 'Complete', color: 'green' as const, option_ids: ['opt-3'] },
          ],
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse status with empty groups', () => {
      const property = {
        type: 'status' as const,
        id: 'prop-26',
        name: 'Status',
        status: {
          options: [{ id: 'opt-1', name: 'Active', color: 'green' as const }],
          groups: [],
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('title property', () => {
    it('should parse title property', () => {
      const property = {
        type: 'title' as const,
        id: 'prop-27',
        name: 'Name',
        title: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('url property', () => {
    it('should parse url property', () => {
      const property = {
        type: 'url' as const,
        id: 'prop-28',
        name: 'Website',
        url: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('unique_id property', () => {
    it('should parse unique_id property with prefix', () => {
      const property = {
        type: 'unique_id' as const,
        id: 'prop-29',
        name: 'ID',
        unique_id: {
          prefix: 'TASK',
        },
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse unique_id property without prefix', () => {
      const property = {
        type: 'unique_id' as const,
        id: 'prop-30',
        name: 'ID',
        unique_id: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('propertiesObjectSchema', () => {
    it('should parse record of properties', () => {
      const properties = {
        Title: {
          type: 'title' as const,
          id: 'prop-1',
          name: 'Title',
          title: {},
        },
        Status: {
          type: 'select' as const,
          id: 'prop-2',
          name: 'Status',
          select: {
            options: [{ id: 'opt-1', name: 'Active', color: 'green' as const }],
          },
        },
        'Created Time': {
          type: 'created_time' as const,
          id: 'prop-3',
          name: 'Created Time',
          created_time: {},
        },
      };

      const result = propertiesObjectSchema.safeParse(properties);
      expect(result.success).toBe(true);
    });

    it('should parse empty properties object', () => {
      const properties = {};

      const result = propertiesObjectSchema.safeParse(properties);
      expect(result.success).toBe(true);
    });

    it('should parse properties with various types', () => {
      const properties = {
        Name: {
          type: 'title' as const,
          id: 'title',
          name: 'Name',
          title: {},
        },
        Tags: {
          type: 'multi_select' as const,
          id: 'tags',
          name: 'Tags',
          multi_select: {
            options: [
              { id: 'tag-1', name: 'Important', color: 'red' as const },
              { id: 'tag-2', name: 'Review', color: 'blue' as const },
            ],
          },
        },
        Price: {
          type: 'number' as const,
          id: 'price',
          name: 'Price',
          number: {
            format: 'dollar' as const,
          },
        },
        'Due Date': {
          type: 'date' as const,
          id: 'due',
          name: 'Due Date',
          date: {},
        },
        Assignee: {
          type: 'people' as const,
          id: 'assign',
          name: 'Assignee',
          people: {},
        },
      };

      const result = propertiesObjectSchema.safeParse(properties);
      expect(result.success).toBe(true);
    });
  });

  describe('property validation', () => {
    it('should reject property with invalid type', () => {
      const property = {
        type: 'invalid_type',
        id: 'prop-1',
        name: 'Test',
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(false);
    });

    it('should reject property with missing required fields', () => {
      const property = {
        type: 'checkbox',
        name: 'Test',
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from string fields', () => {
      const property = {
        type: 'title' as const,
        id: '  prop-1  ',
        name: '  Title  ',
        description: '  A description  ',
        title: {},
      };

      const result = propertyObjectSchema.safeParse(property);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('prop-1');
        expect(result.data.name).toBe('Title');
        expect(result.data.description).toBe('A description');
      }
    });
  });
});
