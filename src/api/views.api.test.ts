import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewsAPI } from './views.api';
import type { NotionClient } from '../client';
import { NotionAPIError } from '../errors';
import { NotionValidationError } from '../validation';

describe('ViewsAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const viewsAPI = new ViewsAPI(mockClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should throw a validation error when neither databaseId nor dataSourceId is provided', async () => {
      await expect(viewsAPI.list({})).rejects.toThrow(NotionValidationError);
    });

    it('should throw a validation error when both databaseId and dataSourceId are provided', async () => {
      await expect(viewsAPI.list({ databaseId: 'db-id', dataSourceId: 'ds-id' })).rejects.toThrow(
        NotionValidationError,
      );
    });
  });

  describe('create', () => {
    it('should throw a validation error when no parent selector is provided', async () => {
      await expect(
        viewsAPI.create({ data_source_id: 'ds-id', name: 'View', type: 'table' }),
      ).rejects.toThrow(NotionValidationError);
    });

    it('should throw a validation error when more than one parent selector is provided', async () => {
      await expect(
        viewsAPI.create({
          data_source_id: 'ds-id',
          name: 'View',
          type: 'table',
          database_id: 'db-id',
          view_id: 'view-id',
        }),
      ).rejects.toThrow(NotionValidationError);
    });
  });

  describe('retrieve', () => {
    it('should propagate a 404 as NotionAPIError', async () => {
      vi.mocked(mockClient.request).mockRejectedValue(
        new NotionAPIError({
          object: 'error',
          status: 404,
          code: 'object_not_found',
          message: 'View not found',
        }),
      );

      try {
        await viewsAPI.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
