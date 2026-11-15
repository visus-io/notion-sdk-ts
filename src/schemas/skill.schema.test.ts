import { describe, expect, it } from 'vitest';
import { skillDownloadSchema, skillPluginSchema, skillUploadResultSchema } from './skill.schema';

const VERSION_ID = 'a'.repeat(64);

describe('skill schemas', () => {
  it('should parse a plugin list item', () => {
    const result = skillPluginSchema.parse({
      id: 'plugin-1',
      name: 'Writing',
      description: 'Writing skills',
      version_id: VERSION_ID,
    });

    expect(result.version_id).toBe(VERSION_ID);
  });

  it('should parse a download link', () => {
    const result = skillDownloadSchema.parse({
      id: 'skill-1',
      version_id: VERSION_ID,
      url: 'https://files.notion.test/skill.tar.gz?sig=1',
    });

    expect(result.url).toBe('https://files.notion.test/skill.tar.gz?sig=1');
  });

  it('should reject a download link that is not a URL', () => {
    expect(() =>
      skillDownloadSchema.parse({ id: 'skill-1', version_id: VERSION_ID, url: 'not a url' }),
    ).toThrow();
  });

  it('should parse an upload result and reject another status', () => {
    const upload = { status: 'completed', page_id: 'page-1', version_id: VERSION_ID };

    expect(skillUploadResultSchema.parse(upload).page_id).toBe('page-1');
    expect(() => skillUploadResultSchema.parse({ ...upload, status: 'pending' })).toThrow();
  });
});
