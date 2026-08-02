import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { CustomEmoji } from '../models';
import { Notion } from '../notion';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('CustomEmojisAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('list', () => {
    it('should list custom emojis over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/custom_emojis`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json({
            object: 'list',
            results: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'party-parrot',
                url: 'https://example.com/party-parrot.png',
              },
            ],
            next_cursor: null,
            has_more: false,
            type: 'custom_emoji',
          });
        }),
      );

      const result = await notion.customEmojis.list();

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toBeInstanceOf(CustomEmoji);
      expect(result.results[0].name).toBe('party-parrot');
    });

    it('should send name as a query param', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/custom_emojis`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('name')).toBe('party-parrot');
          return HttpResponse.json({
            object: 'list',
            results: [],
            next_cursor: null,
            has_more: false,
            type: 'custom_emoji',
          });
        }),
      );

      await notion.customEmojis.list({ name: 'party-parrot' });
    });

    it('should paginate via cursor', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/custom_emojis`, () =>
          HttpResponse.json({
            object: 'list',
            results: [],
            next_cursor: 'next-cursor-123',
            has_more: true,
            type: 'custom_emoji',
          }),
        ),
      );

      const result = await notion.customEmojis.list();

      expect(result.next_cursor).toBe('next-cursor-123');
      expect(result.has_more).toBe(true);
    });

    it('should return an empty list', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/custom_emojis`, () =>
          HttpResponse.json({
            object: 'list',
            results: [],
            next_cursor: null,
            has_more: false,
            type: 'custom_emoji',
          }),
        ),
      );

      const result = await notion.customEmojis.list();

      expect(result.results).toHaveLength(0);
    });
  });
});
