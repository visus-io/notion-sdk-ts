import { describe, expect, it } from 'vitest';
import { View } from '.';

describe('View', () => {
  const baseUser = { object: 'user' as const, id: '323e4567-e89b-12d3-a456-426614174000' };

  const baseViewData = {
    object: 'view' as const,
    id: '123e4567-e89b-12d3-a456-426614174000',
    parent: {
      type: 'database_id' as const,
      database_id: '223e4567-e89b-12d3-a456-426614174000',
    },
    data_source_id: '323e4567-e89b-12d3-a456-426614174001',
    name: 'All items',
    type: 'table' as const,
    created_time: '2026-01-01T00:00:00.000Z',
    last_edited_time: '2026-01-02T00:00:00.000Z',
    created_by: baseUser,
    last_edited_by: baseUser,
    url: 'https://notion.so/view-id',
  };

  it('should expose getters for a view', () => {
    const view = new View(baseViewData);

    expect(view.object).toBe('view');
    expect(view.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(view.parent).toEqual(baseViewData.parent);
    expect(view.dataSourceId).toBe('323e4567-e89b-12d3-a456-426614174001');
    expect(view.name).toBe('All items');
    expect(view.type).toBe('table');
    expect(view.createdTime).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(view.lastEditedTime).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    expect(view.createdBy).toEqual(baseUser);
    expect(view.lastEditedBy).toEqual(baseUser);
    expect(view.url).toBe('https://notion.so/view-id');
  });

  it('should expose filter/sorts/quick_filters/configuration when present', () => {
    const view = new View({
      ...baseViewData,
      filter: { property: 'Status' },
      sorts: [{ property: 'Name', direction: 'ascending' }],
      quick_filters: { some_filter: true },
      configuration: { type: 'table', some_field: 'value' },
    });

    expect(view.filter).toEqual({ property: 'Status' });
    expect(view.sorts).toEqual([{ property: 'Name', direction: 'ascending' }]);
    expect(view.quickFilters).toEqual({ some_filter: true });
    expect(view.configuration).toEqual({ type: 'table', some_field: 'value' });
  });

  it('should identify widget views via dashboardViewId', () => {
    const nonWidget = new View(baseViewData);
    expect(nonWidget.dashboardViewId).toBeUndefined();
    expect(nonWidget.isWidgetView()).toBe(false);

    const widget = new View({
      ...baseViewData,
      type: 'chart',
      dashboard_view_id: '423e4567-e89b-12d3-a456-426614174002',
    });
    expect(widget.dashboardViewId).toBe('423e4567-e89b-12d3-a456-426614174002');
    expect(widget.isWidgetView()).toBe(true);
  });
});
