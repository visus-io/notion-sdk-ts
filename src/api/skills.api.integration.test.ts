import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { paginate } from '../helpers';
import { Notion } from '../notion';
import { buildErrorBody } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

const AI_URL = `${NOTION_TEST_BASE_URL}/v1/ai`;
const SKILL_ID = '423e4567-e89b-12d3-a456-426614174000';
const VERSION_ID = 'b'.repeat(64);

function plugin(id: string): Record<string, string> {
  return { id, name: `Plugin ${id}`, description: 'Skills', version_id: VERSION_ID };
}

describe('SkillsAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  // ---------------------------------------------------------------------------
  // listPlugins
  // ---------------------------------------------------------------------------

  describe('listPlugins', () => {
    it('should send page_size and start_cursor as query params', async () => {
      server.use(
        http.get(`${AI_URL}/plugins`, ({ request }) => {
          const params = new URL(request.url).searchParams;
          expect(params.get('page_size')).toBe('25');
          expect(params.get('start_cursor')).toBe('abc123');
          return HttpResponse.json({
            object: 'list',
            type: 'plugin',
            results: [plugin('p1')],
            has_more: false,
            next_cursor: null,
          });
        }),
      );

      const result = await notion.skills.listPlugins({ page_size: 25, start_cursor: 'abc123' });

      expect(result.type).toBe('plugin');
      expect(result.results).toEqual([plugin('p1')]);
    });

    it('should page through every plugin with paginate()', async () => {
      server.use(
        http.get(`${AI_URL}/plugins`, ({ request }) => {
          const cursor = new URL(request.url).searchParams.get('start_cursor');
          return HttpResponse.json(
            cursor === null
              ? {
                  object: 'list',
                  type: 'plugin',
                  results: [plugin('p1')],
                  has_more: true,
                  next_cursor: 'page2',
                }
              : {
                  object: 'list',
                  type: 'plugin',
                  results: [plugin('p2')],
                  has_more: false,
                  next_cursor: null,
                },
          );
        }),
      );

      const plugins = await paginate((cursor) =>
        notion.skills.listPlugins({ start_cursor: cursor }),
      );

      expect(plugins.map((item) => item.id)).toEqual(['p1', 'p2']);
    });
  });

  // ---------------------------------------------------------------------------
  // retrievePlugin / retrieve
  // ---------------------------------------------------------------------------

  describe('downloads', () => {
    it('should retrieve a plugin download link', async () => {
      server.use(
        http.get(`${AI_URL}/plugins/p1`, () =>
          HttpResponse.json({
            id: 'p1',
            version_id: VERSION_ID,
            url: 'https://files.notion.test/p1.tar.gz?sig=1',
            request_id: 'req-1',
          }),
        ),
      );

      const download = await notion.skills.retrievePlugin('p1');

      expect(download.url).toBe('https://files.notion.test/p1.tar.gz?sig=1');
      expect(download.version_id).toBe(VERSION_ID);
    });

    it('should retrieve a skill download link', async () => {
      server.use(
        http.get(`${AI_URL}/skills/${SKILL_ID}`, () =>
          HttpResponse.json({
            id: SKILL_ID,
            version_id: VERSION_ID,
            url: 'https://files.notion.test/skill.tar.gz',
          }),
        ),
      );

      expect((await notion.skills.retrieve(SKILL_ID)).id).toBe(SKILL_ID);
    });

    it('should surface a 404 for a skill that is not shared', async () => {
      server.use(
        http.get(`${AI_URL}/skills/${SKILL_ID}`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Not found'), { status: 404 }),
        ),
      );

      const error = await notion.skills.retrieve(SKILL_ID).catch((e: unknown) => e);

      expect((error as NotionAPIError).isNotFound()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // upload
  // ---------------------------------------------------------------------------

  describe('upload', () => {
    it('should POST the archive as a multipart file part and parse the result', async () => {
      server.use(
        http.post(`${AI_URL}/skills/${SKILL_ID}/upload`, async ({ request }) => {
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/);

          const form = await request.formData();
          expect([...form.keys()]).toEqual(['file']);
          const file = form.get('file') as File;
          expect(file.name).toBe('skill.tar.gz');
          expect(file.type).toBe('application/gzip');
          expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([31, 139, 8]));

          return HttpResponse.json({
            status: 'completed',
            page_id: SKILL_ID,
            version_id: VERSION_ID,
          });
        }),
      );

      const result = await notion.skills.upload(SKILL_ID, new Uint8Array([31, 139, 8]));

      expect(result).toEqual({ status: 'completed', page_id: SKILL_ID, version_id: VERSION_ID });
    });

    it('should surface a 404 when the page is not in a Skills database', async () => {
      server.use(
        http.post(`${AI_URL}/skills/${SKILL_ID}/upload`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Not found'), { status: 404 }),
        ),
      );

      await expect(notion.skills.upload(SKILL_ID, new Uint8Array([1]))).rejects.toBeInstanceOf(
        NotionAPIError,
      );
    });
  });
});
