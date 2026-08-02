import { describe, it, expect, vi } from 'vitest';
import {
  collectAllDataSourceRows,
  paginate,
  paginateIterator,
  paginateWithMetadata,
  type PaginatedFetchFunction,
  type WindowedFetchFunction,
} from './pagination.helpers';
import type { PaginatedList } from '../schemas';

type MockItem = { id: string };
type MockRow = { id: string; createdTime: Date };

describe('pagination helpers', () => {
  describe('paginate', () => {
    it('should collect all results from a single page', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        object: 'list',
        results: [{ id: '1' }, { id: '2' }, { id: '3' }],
        next_cursor: null,
        has_more: false,
        type: 'page',
      } as PaginatedList<{ id: string }>);

      const results = await paginate(mockFetch);

      expect(results).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(undefined);
    });

    it('should collect all results from multiple pages', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1' }, { id: '2' }],
          next_cursor: 'cursor-1',
          has_more: true,
          type: 'page',
        } as PaginatedList<{ id: string }>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '3' }, { id: '4' }],
          next_cursor: 'cursor-2',
          has_more: true,
          type: 'page',
        } as PaginatedList<{ id: string }>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '5' }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        } as PaginatedList<{ id: string }>);

      const results = await paginate(mockFetch);

      expect(results).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenNthCalledWith(1, undefined);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'cursor-1');
      expect(mockFetch).toHaveBeenNthCalledWith(3, 'cursor-2');
    });

    it('should handle empty results', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        object: 'list',
        results: [],
        next_cursor: null,
        has_more: false,
        type: 'page',
      } as PaginatedList<{ id: string }>);

      const results = await paginate(mockFetch);

      expect(results).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should pass cursor through correctly on subsequent calls', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1' }],
          next_cursor: 'abc123',
          has_more: true,
          type: 'page',
        } as PaginatedList<{ id: string }>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '2' }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        } as PaginatedList<{ id: string }>);

      await paginate(mockFetch);

      expect(mockFetch).toHaveBeenNthCalledWith(1, undefined);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'abc123');
    });
  });

  describe('paginateIterator', () => {
    it('should yield all items from a single page', async () => {
      const mockFetch: PaginatedFetchFunction<MockItem> = vi.fn().mockResolvedValueOnce({
        object: 'list',
        results: [{ id: '1' }, { id: '2' }, { id: '3' }],
        next_cursor: null,
        has_more: false,
        type: 'page',
      } as PaginatedList<MockItem>);

      const results: MockItem[] = [];
      for await (const item of paginateIterator(mockFetch)) {
        results.push(item);
      }

      expect(results).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should yield all items from multiple pages', async () => {
      const mockFetch: PaginatedFetchFunction<MockItem> = vi
        .fn()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1' }, { id: '2' }],
          next_cursor: 'cursor-1',
          has_more: true,
          type: 'page',
        } as PaginatedList<MockItem>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '3' }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        } as PaginatedList<MockItem>);

      const results: MockItem[] = [];
      for await (const item of paginateIterator(mockFetch)) {
        results.push(item);
      }

      expect(results).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, undefined);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'cursor-1');
    });

    it('should handle empty results', async () => {
      const mockFetch: PaginatedFetchFunction<MockItem> = vi.fn().mockResolvedValueOnce({
        object: 'list',
        results: [],
        next_cursor: null,
        has_more: false,
        type: 'page',
      } as PaginatedList<MockItem>);

      const results: MockItem[] = [];
      for await (const item of paginateIterator(mockFetch)) {
        results.push(item);
      }

      expect(results).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should allow early break from iteration', async () => {
      const mockFetch: PaginatedFetchFunction<MockItem> = vi
        .fn()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1' }, { id: '2' }, { id: '3' }],
          next_cursor: 'cursor-1',
          has_more: true,
          type: 'page',
        } as PaginatedList<MockItem>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '4' }, { id: '5' }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        } as PaginatedList<MockItem>);

      const results: MockItem[] = [];
      for await (const item of paginateIterator(mockFetch)) {
        results.push(item);
        if (item.id === '2') {
          break;
        }
      }

      // Should only have called fetch once and stopped early
      expect(results).toEqual([{ id: '1' }, { id: '2' }]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should fetch next page when needed during iteration', async () => {
      const mockFetch: PaginatedFetchFunction<MockItem> = vi
        .fn()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1' }, { id: '2' }],
          next_cursor: 'cursor-1',
          has_more: true,
          type: 'page',
        } as PaginatedList<MockItem>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '3' }, { id: '4' }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        } as PaginatedList<MockItem>);

      const results: MockItem[] = [];
      let count = 0;
      for await (const item of paginateIterator(mockFetch)) {
        results.push(item);
        count++;
        // After processing 2 items, the iterator should fetch the next page
        if (count === 2) {
          expect(mockFetch).toHaveBeenCalledTimes(1);
        }
      }

      expect(results).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('paginateWithMetadata', () => {
    it('should return items and metadata for a single page', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        object: 'list',
        results: [{ id: '1' }, { id: '2' }, { id: '3' }],
        next_cursor: null,
        has_more: false,
        type: 'page',
      } as PaginatedList<{ id: string }>);

      const result = await paginateWithMetadata(mockFetch);

      expect(result).toEqual({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        pageCount: 1,
        totalCount: 3,
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return items and metadata for multiple pages', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1' }, { id: '2' }],
          next_cursor: 'cursor-1',
          has_more: true,
          type: 'page',
        } as PaginatedList<{ id: string }>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '3' }, { id: '4' }],
          next_cursor: 'cursor-2',
          has_more: true,
          type: 'page',
        } as PaginatedList<{ id: string }>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '5' }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        } as PaginatedList<{ id: string }>);

      const result = await paginateWithMetadata(mockFetch);

      expect(result).toEqual({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
        pageCount: 3,
        totalCount: 5,
      });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle empty results', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        object: 'list',
        results: [],
        next_cursor: null,
        has_more: false,
        type: 'page',
      } as PaginatedList<{ id: string }>);

      const result = await paginateWithMetadata(mockFetch);

      expect(result).toEqual({
        items: [],
        pageCount: 1,
        totalCount: 0,
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should correctly count pages with varying result sizes', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1' }],
          next_cursor: 'cursor-1',
          has_more: true,
          type: 'page',
        } as PaginatedList<{ id: string }>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '2' }, { id: '3' }, { id: '4' }],
          next_cursor: 'cursor-2',
          has_more: true,
          type: 'page',
        } as PaginatedList<{ id: string }>)
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '5' }, { id: '6' }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        } as PaginatedList<{ id: string }>);

      const result = await paginateWithMetadata(mockFetch);

      expect(result).toEqual({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }],
        pageCount: 3,
        totalCount: 6,
      });
    });
  });

  describe('collectAllDataSourceRows', () => {
    it('should behave like normal pagination when no window is capped', async () => {
      const mockFetch = vi
        .fn<WindowedFetchFunction<MockRow>>()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1', createdTime: new Date('2026-01-01T00:00:00.000Z') }],
          next_cursor: 'cursor-1',
          has_more: true,
          type: 'page',
        })
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '2', createdTime: new Date('2026-01-02T00:00:00.000Z') }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        });

      const rows = await collectAllDataSourceRows(mockFetch);

      expect(rows.map((r) => r.id)).toEqual(['1', '2']);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, undefined, undefined);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'cursor-1', undefined);
    });

    it('should start a new window scoped to created_time when a query is capped', async () => {
      const lastCreatedTime = new Date('2026-01-05T00:00:00.000Z');

      const mockFetch = vi
        .fn<WindowedFetchFunction<MockRow>>()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1', createdTime: lastCreatedTime }],
          next_cursor: null,
          has_more: false,
          type: 'page',
          request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
        })
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '2', createdTime: new Date('2026-01-06T00:00:00.000Z') }],
          next_cursor: null,
          has_more: false,
          type: 'page',
        });

      const rows = await collectAllDataSourceRows(mockFetch);

      expect(rows.map((r) => r.id)).toEqual(['1', '2']);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(2, undefined, lastCreatedTime.toISOString());
    });

    it('should de-duplicate a row that appears at both ends of a window boundary', async () => {
      const boundaryTime = new Date('2026-01-05T00:00:00.000Z');

      const mockFetch = vi
        .fn<WindowedFetchFunction<MockRow>>()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1', createdTime: boundaryTime }],
          next_cursor: null,
          has_more: false,
          type: 'page',
          request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
        })
        .mockResolvedValueOnce({
          object: 'list',
          // Boundary row '1' re-appears (created_time >= filter includes it again), plus new row '2'.
          results: [
            { id: '1', createdTime: boundaryTime },
            { id: '2', createdTime: new Date('2026-01-06T00:00:00.000Z') },
          ],
          next_cursor: null,
          has_more: false,
          type: 'page',
        });

      const rows = await collectAllDataSourceRows(mockFetch);

      expect(rows.map((r) => r.id)).toEqual(['1', '2']);
    });

    it('should terminate after the expected number of calls once a window finishes normally', async () => {
      const mockFetch = vi.fn<WindowedFetchFunction<MockRow>>().mockResolvedValueOnce({
        object: 'list',
        results: [{ id: '1', createdTime: new Date('2026-01-01T00:00:00.000Z') }],
        next_cursor: null,
        has_more: false,
        type: 'page',
      });

      const rows = await collectAllDataSourceRows(mockFetch);

      expect(rows).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw instead of looping forever when a window makes no progress', async () => {
      const tieTime = new Date('2026-01-05T00:00:00.000Z');

      // Every row in the capped window shares the exact same created_time as the
      // previous window's cursor, so created_time >= filtering can't move forward --
      // the same page would be returned on every subsequent call.
      const mockFetch = vi
        .fn<WindowedFetchFunction<MockRow>>()
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1', createdTime: tieTime }],
          next_cursor: null,
          has_more: false,
          type: 'page',
          request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
        })
        .mockResolvedValueOnce({
          object: 'list',
          results: [{ id: '1', createdTime: tieTime }],
          next_cursor: null,
          has_more: false,
          type: 'page',
          request_status: { type: 'incomplete', incomplete_reason: 'query_result_limit_reached' },
        });

      await expect(collectAllDataSourceRows(mockFetch)).rejects.toThrow(
        /cannot make forward progress/,
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
