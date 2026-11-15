import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillsAPI } from './skills.api';
import type { NotionClient } from '../client';
import { LIMITS, NotionValidationError } from '../validation';

describe('SkillsAPI', () => {
  const mockClient = {
    request: vi.fn(),
    requestMultipart: vi.fn(),
  } as unknown as NotionClient;

  const skillsAPI = new SkillsAPI(mockClient);
  const uploadResult = { status: 'completed', page_id: 'p', version_id: 'v' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listPlugins', () => {
    it.each([0, 101, 2.5])('should reject page_size %s', async (pageSize) => {
      await expect(skillsAPI.listPlugins({ page_size: pageSize })).rejects.toThrow(
        NotionValidationError,
      );
      expect(mockClient.request).not.toHaveBeenCalled();
    });

    it('should send no query without options and omit a null cursor', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({
        object: 'list',
        type: 'plugin',
        results: [],
        has_more: false,
        next_cursor: null,
      });

      await skillsAPI.listPlugins({ start_cursor: null });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ai/plugins',
        query: undefined,
      });
    });
  });

  describe('upload', () => {
    it('should reject an empty archive', async () => {
      await expect(skillsAPI.upload('p', new Uint8Array())).rejects.toThrow(/empty/);
      expect(mockClient.requestMultipart).not.toHaveBeenCalled();
    });

    it('should accept an archive at 20 MiB and reject one byte more', async () => {
      vi.mocked(mockClient.requestMultipart).mockResolvedValue(uploadResult);

      await expect(
        skillsAPI.upload('p', new Uint8Array(LIMITS.SKILL_ARCHIVE_BYTES)),
      ).resolves.toEqual(uploadResult);
      await expect(
        skillsAPI.upload('p', new Uint8Array(LIMITS.SKILL_ARCHIVE_BYTES + 1)),
      ).rejects.toThrow(/20971520-byte limit/);
    });

    it.each([
      ['Buffer', Buffer.from([1, 2])],
      ['Uint8Array', new Uint8Array([1, 2])],
      ['ArrayBuffer', new Uint8Array([1, 2]).buffer],
      ['Blob', new Blob([new Uint8Array([1, 2])], { type: 'application/gzip' })],
    ])('should send a %s archive as the file part', async (_label, archive) => {
      vi.mocked(mockClient.requestMultipart).mockResolvedValue(uploadResult);

      await skillsAPI.upload('page-1', archive);

      const [path, form] = vi.mocked(mockClient.requestMultipart).mock.calls[0];
      expect(path).toBe('/ai/skills/page-1/upload');
      const file = (form as FormData).get('file') as File;
      expect(file.size).toBe(2);
      expect(file.name).toBe('skill.tar.gz');
    });

    it('should reject an unsupported archive type', async () => {
      await expect(skillsAPI.upload('p', 'text' as never)).rejects.toBeInstanceOf(TypeError);
    });
  });
});
