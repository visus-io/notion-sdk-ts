import { BaseModel } from './base.model';
import {
  type NotionParent,
  type NotionUser,
  type NotionView,
  type ViewConfiguration,
  viewSchema,
  type ViewType,
} from '../schemas';

/**
 * View model class with helper methods.
 *
 * A view controls how a database or data source shows its rows, for example as a
 * table, board, or calendar.
 *
 * @category Views
 */
export class View extends BaseModel<NotionView> {
  constructor(data: NotionView) {
    super(data, viewSchema);
  }

  /**
   * Returns "view" - the object type.
   */
  get object(): 'view' {
    return this.data.object;
  }

  /**
   * Returns the view ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the parent object (database reference).
   */
  get parent(): NotionParent {
    return this.data.parent;
  }

  /**
   * Returns the data source ID this view belongs to, or null for dashboard views.
   */
  get dataSourceId(): string | null {
    return this.data.data_source_id;
  }

  /**
   * Returns the view name.
   */
  get name(): string {
    return this.data.name;
  }

  /**
   * Returns the view type, for example table, board, or calendar.
   */
  get type(): ViewType {
    return this.data.type;
  }

  /**
   * Returns the view's filter, if any.
   */
  get filter(): Record<string, unknown> | null | undefined {
    return this.data.filter;
  }

  /**
   * Returns the view's sorts, if any.
   */
  get sorts(): Record<string, unknown>[] | null | undefined {
    return this.data.sorts;
  }

  /**
   * Returns the view's quick filters, if any.
   */
  get quickFilters(): Record<string, unknown> | null | undefined {
    return this.data.quick_filters;
  }

  /**
   * Returns the view's per-layout configuration, if any.
   */
  get configuration(): ViewConfiguration | undefined {
    return this.data.configuration;
  }

  /**
   * Returns the created time as a Date object.
   */
  get createdTime(): Date {
    return new Date(this.data.created_time);
  }

  /**
   * Returns the last edited time as a Date object.
   */
  get lastEditedTime(): Date {
    return new Date(this.data.last_edited_time);
  }

  /**
   * Returns the user who created the view.
   */
  get createdBy(): NotionUser {
    return this.data.created_by;
  }

  /**
   * Returns the user who last edited the view.
   */
  get lastEditedBy(): NotionUser {
    return this.data.last_edited_by;
  }

  /**
   * Returns the Notion URL of the view.
   */
  get url(): string {
    return this.data.url;
  }

  /**
   * Returns the widget ID, if a dashboard shows this view as a widget.
   */
  get dashboardViewId(): string | undefined {
    return this.data.dashboard_view_id;
  }

  /**
   * Returns whether a dashboard shows this view as a widget.
   */
  isWidgetView(): boolean {
    return this.data.dashboard_view_id !== undefined;
  }
}
