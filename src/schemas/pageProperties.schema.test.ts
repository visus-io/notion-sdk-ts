import { describe, expect, it } from 'vitest';
import { pagePropertiesSchema } from './pageProperties.schema';

describe('pagePropertiesSchema', () => {
  const baseUser = {
    object: 'user' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
  };

  const richTextArray = [
    {
      type: 'text' as const,
      text: { content: 'Hello', link: null },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default' as const,
      },
      plain_text: 'Hello',
      href: null,
    },
  ];

  describe('checkbox property', () => {
    it('should parse checkbox property with true value', () => {
      const property = {
        id: 'prop-1',
        type: 'checkbox' as const,
        checkbox: true,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse checkbox property with false value', () => {
      const property = {
        id: 'prop-2',
        type: 'checkbox' as const,
        checkbox: false,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('created_by property', () => {
    it('should parse created_by property', () => {
      const property = {
        id: 'prop-3',
        type: 'created_by' as const,
        created_by: baseUser,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('created_time property', () => {
    it('should parse created_time property', () => {
      const property = {
        id: 'prop-4',
        type: 'created_time' as const,
        created_time: '2024-01-01T00:00:00.000Z',
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const property = {
        id: 'prop-4',
        type: 'created_time',
        created_time: 'not-a-datetime',
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(false);
    });
  });

  describe('date property', () => {
    it('should parse date property with start only', () => {
      const property = {
        id: 'prop-5',
        type: 'date' as const,
        date: {
          start: '2024-01-01',
          end: null,
          time_zone: null,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse date property with start and end', () => {
      const property = {
        id: 'prop-6',
        type: 'date' as const,
        date: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-02T00:00:00.000Z',
          time_zone: 'America/New_York',
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null date property', () => {
      const property = {
        id: 'prop-7',
        type: 'date' as const,
        date: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('email property', () => {
    it('should parse email property with value', () => {
      const property = {
        id: 'prop-8',
        type: 'email' as const,
        email: 'test@example.com',
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null email property', () => {
      const property = {
        id: 'prop-9',
        type: 'email' as const,
        email: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('files property', () => {
    it('should parse files property with external file', () => {
      const property = {
        id: 'prop-10',
        type: 'files' as const,
        files: [
          {
            name: 'document.pdf',
            type: 'external' as const,
            external: { url: 'https://example.com/doc.pdf' },
          },
        ],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse files property with uploaded file', () => {
      const property = {
        id: 'prop-11',
        type: 'files' as const,
        files: [
          {
            name: 'image.png',
            type: 'file' as const,
            file: {
              url: 'https://s3.amazonaws.com/notion/image.png',
              expiry_time: '2024-12-31T23:59:59.999Z',
            },
          },
        ],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse files property with file_upload', () => {
      const property = {
        id: 'prop-12',
        type: 'files' as const,
        files: [
          {
            name: 'data.csv',
            type: 'file_upload' as const,
            file_upload: { id: '123e4567-e89b-12d3-a456-426614174001' },
          },
        ],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse empty files array', () => {
      const property = {
        id: 'prop-13',
        type: 'files' as const,
        files: [],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('formula property', () => {
    it('should parse boolean formula', () => {
      const property = {
        id: 'prop-14',
        type: 'formula' as const,
        formula: {
          type: 'boolean' as const,
          boolean: true,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse date formula', () => {
      const property = {
        id: 'prop-15',
        type: 'formula' as const,
        formula: {
          type: 'date' as const,
          date: {
            start: '2024-01-01',
            end: null,
            time_zone: null,
          },
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse number formula', () => {
      const property = {
        id: 'prop-16',
        type: 'formula' as const,
        formula: {
          type: 'number' as const,
          number: 42.5,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse number formula with null', () => {
      const property = {
        id: 'prop-17',
        type: 'formula' as const,
        formula: {
          type: 'number' as const,
          number: null,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse string formula', () => {
      const property = {
        id: 'prop-18',
        type: 'formula' as const,
        formula: {
          type: 'string' as const,
          string: 'Hello World',
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse string formula with null', () => {
      const property = {
        id: 'prop-19',
        type: 'formula' as const,
        formula: {
          type: 'string' as const,
          string: null,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse unsupported formula', () => {
      const property = {
        id: 'prop-19a',
        type: 'formula' as const,
        formula: {
          type: 'unsupported' as const,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('last_edited_by property', () => {
    it('should parse last_edited_by property', () => {
      const property = {
        id: 'prop-20',
        type: 'last_edited_by' as const,
        last_edited_by: baseUser,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('last_edited_time property', () => {
    it('should parse last_edited_time property', () => {
      const property = {
        id: 'prop-21',
        type: 'last_edited_time' as const,
        last_edited_time: '2024-01-02T12:00:00.000Z',
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('multi_select property', () => {
    it('should parse multi_select property with multiple options', () => {
      const property = {
        id: 'prop-22',
        type: 'multi_select' as const,
        multi_select: [
          { id: 'opt-1', name: 'Tag 1', color: 'blue' as const },
          { id: 'opt-2', name: 'Tag 2', color: 'green' as const },
        ],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse empty multi_select', () => {
      const property = {
        id: 'prop-23',
        type: 'multi_select' as const,
        multi_select: [],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('number property', () => {
    it('should parse number property with value', () => {
      const property = {
        id: 'prop-24',
        type: 'number' as const,
        number: 123.45,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null number property', () => {
      const property = {
        id: 'prop-25',
        type: 'number' as const,
        number: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse zero number property', () => {
      const property = {
        id: 'prop-26',
        type: 'number' as const,
        number: 0,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse negative number property', () => {
      const property = {
        id: 'prop-27',
        type: 'number' as const,
        number: -99.9,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('people property', () => {
    it('should parse people property with multiple users', () => {
      const property = {
        id: 'prop-28',
        type: 'people' as const,
        people: [
          { object: 'user' as const, id: '123e4567-e89b-12d3-a456-426614174001' },
          { object: 'user' as const, id: '123e4567-e89b-12d3-a456-426614174002' },
        ],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse empty people property', () => {
      const property = {
        id: 'prop-29',
        type: 'people' as const,
        people: [],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('phone_number property', () => {
    it('should parse phone_number property with value', () => {
      const property = {
        id: 'prop-30',
        type: 'phone_number' as const,
        phone_number: '+1-555-123-4567',
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null phone_number property', () => {
      const property = {
        id: 'prop-31',
        type: 'phone_number' as const,
        phone_number: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('relation property', () => {
    it('should parse relation property with related pages', () => {
      const property = {
        id: 'prop-32',
        type: 'relation' as const,
        relation: [
          { id: '123e4567-e89b-12d3-a456-426614174010' },
          { id: '123e4567-e89b-12d3-a456-426614174011' },
        ],
        has_more: false,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse relation property with has_more true', () => {
      const property = {
        id: 'prop-33',
        type: 'relation' as const,
        relation: [{ id: '123e4567-e89b-12d3-a456-426614174020' }],
        has_more: true,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse empty relation property', () => {
      const property = {
        id: 'prop-34',
        type: 'relation' as const,
        relation: [],
        has_more: false,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('rich_text property', () => {
    it('should parse rich_text property', () => {
      const property = {
        id: 'prop-35',
        type: 'rich_text' as const,
        rich_text: richTextArray,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse empty rich_text property', () => {
      const property = {
        id: 'prop-36',
        type: 'rich_text' as const,
        rich_text: [],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('rollup property', () => {
    it('should parse rollup property with number result', () => {
      const property = {
        id: 'prop-37',
        type: 'rollup' as const,
        rollup: {
          type: 'number' as const,
          function: 'sum' as const,
          number: 150.5,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse rollup property with null number', () => {
      const property = {
        id: 'prop-38',
        type: 'rollup' as const,
        rollup: {
          type: 'number' as const,
          function: 'average' as const,
          number: null,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse rollup property with date result', () => {
      const property = {
        id: 'prop-39',
        type: 'rollup' as const,
        rollup: {
          type: 'date' as const,
          function: 'latest_date' as const,
          date: {
            start: '2024-01-15',
            end: null,
            time_zone: null,
          },
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse rollup property with array type', () => {
      const property = {
        id: 'prop-40',
        type: 'rollup' as const,
        rollup: {
          type: 'array' as const,
          function: 'show_original' as const,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse rollup property with array type and array data', () => {
      const property = {
        id: 'prop-rollup-array',
        type: 'rollup' as const,
        rollup: {
          type: 'array' as const,
          function: 'show_original' as const,
          array: [
            {
              type: 'number' as const,
              number: 123,
            },
            {
              type: 'number' as const,
              number: 456,
            },
          ],
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
      if (result.success && result.data.type === 'rollup') {
        expect(result.data.rollup.array).toBeDefined();
        expect(result.data.rollup.array).toHaveLength(2);
      }
    });

    it('should parse rollup property with array type containing different property types', () => {
      const property = {
        id: 'prop-rollup-mixed-array',
        type: 'rollup' as const,
        rollup: {
          type: 'array' as const,
          function: 'show_original' as const,
          array: [
            {
              type: 'rich_text' as const,
              rich_text: [{ type: 'text', text: { content: 'Hello' }, plain_text: 'Hello' }],
            },
            {
              type: 'checkbox' as const,
              checkbox: true,
            },
            {
              type: 'number' as const,
              number: 42,
            },
          ],
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
      if (result.success && result.data.type === 'rollup') {
        expect(result.data.rollup.array).toBeDefined();
        expect(result.data.rollup.array).toHaveLength(3);
      }
    });

    it('should parse all rollup function types', () => {
      const functions = [
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
      ] as const;

      functions.forEach((func) => {
        const property = {
          id: 'prop-rollup',
          type: 'rollup' as const,
          rollup: {
            type: 'number' as const,
            function: func,
            number: 42,
          },
        };

        const result = pagePropertiesSchema.safeParse(property);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('select property', () => {
    it('should parse select property with value', () => {
      const property = {
        id: 'prop-41',
        type: 'select' as const,
        select: {
          id: 'sel-1',
          name: 'Option A',
          color: 'purple' as const,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null select property', () => {
      const property = {
        id: 'prop-42',
        type: 'select' as const,
        select: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('status property', () => {
    it('should parse status property with value', () => {
      const property = {
        id: 'prop-43',
        type: 'status' as const,
        status: {
          id: 'status-1',
          name: 'In Progress',
          color: 'yellow' as const,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null status property', () => {
      const property = {
        id: 'prop-44',
        type: 'status' as const,
        status: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('title property', () => {
    it('should parse title property', () => {
      const property = {
        id: 'prop-45',
        type: 'title' as const,
        title: richTextArray,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse empty title property', () => {
      const property = {
        id: 'prop-46',
        type: 'title' as const,
        title: [],
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe('url property', () => {
    it('should parse url property with valid URL', () => {
      const property = {
        id: 'prop-47',
        type: 'url' as const,
        url: 'https://example.com',
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null url property', () => {
      const property = {
        id: 'prop-48',
        type: 'url' as const,
        url: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const property = {
        id: 'prop-49',
        type: 'url',
        url: 'not-a-url',
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(false);
    });
  });

  describe('unique_id property', () => {
    it('should parse unique_id property with prefix', () => {
      const property = {
        id: 'prop-50',
        type: 'unique_id' as const,
        unique_id: {
          number: 42,
          prefix: 'TASK',
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse unique_id property without prefix', () => {
      const property = {
        id: 'prop-51',
        type: 'unique_id' as const,
        unique_id: {
          number: 100,
          prefix: null,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should reject non-integer unique_id number', () => {
      const property = {
        id: 'prop-52',
        type: 'unique_id',
        unique_id: {
          number: 42.5,
          prefix: null,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(false);
    });
  });

  describe('verification property', () => {
    it('should parse verified verification property', () => {
      const property = {
        id: 'prop-53',
        type: 'verification' as const,
        verification: {
          state: 'verified' as const,
          verified_by: baseUser,
          date: {
            start: '2024-01-01T00:00:00.000Z',
            end: null,
            time_zone: null,
          },
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse unverified verification property', () => {
      const property = {
        id: 'prop-54',
        type: 'verification' as const,
        verification: {
          state: 'unverified' as const,
          verified_by: null,
          date: null,
        },
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it('should parse null verification property', () => {
      const property = {
        id: 'prop-55',
        type: 'verification' as const,
        verification: null,
      };

      const result = pagePropertiesSchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });
});
