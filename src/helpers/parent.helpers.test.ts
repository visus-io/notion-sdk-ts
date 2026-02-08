import { describe, expect, it } from 'vitest';
import { parent } from './parent.helpers';

describe('parent helpers', () => {
  it('should create a page parent', () => {
    expect(parent.page('page-123')).toEqual({ page_id: 'page-123' });
  });

  it('should create a database parent', () => {
    expect(parent.database('db-456')).toEqual({ database_id: 'db-456' });
  });

  it('should create a data source parent', () => {
    expect(parent.dataSource('ds-789')).toEqual({ data_source_id: 'ds-789' });
  });

  it('should create a workspace parent', () => {
    expect(parent.workspace()).toEqual({ workspace: true });
  });

  it('should create a block parent', () => {
    expect(parent.block('block-abc')).toEqual({ block_id: 'block-abc' });
  });
});
