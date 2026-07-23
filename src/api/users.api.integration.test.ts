import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { User } from '../models';
import { Notion } from '../notion';
import { buildBotUserResponse, buildErrorBody, buildUserResponse } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

describe('UsersAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });
  const userId = '323e4567-e89b-12d3-a456-426614174000';

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should retrieve a user over the network and send the fixed request headers', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/users/${userId}`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          expect(request.headers.get('Authorization')).toBe(`Bearer ${NOTION_TEST_AUTH_TOKEN}`);
          return HttpResponse.json(buildUserResponse({ id: userId }));
        }),
      );

      const result = await notion.users.retrieve(userId);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(userId);
      expect(result.isPerson()).toBe(true);
    });
  });

  describe('list', () => {
    it('should list a paginated list of users', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/users`, () =>
          HttpResponse.json({
            object: 'list',
            results: [buildUserResponse(), buildBotUserResponse()],
            next_cursor: null,
            has_more: false,
            type: 'user',
          }),
        ),
      );

      const result = await notion.users.list();

      expect(result.results).toHaveLength(2);
      expect(result.results.every((user) => user instanceof User)).toBe(true);
    });
  });

  describe('me', () => {
    it('should retrieve the bot user for the integration token', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/users/me`, () =>
          HttpResponse.json(buildBotUserResponse()),
        ),
      );

      const result = await notion.users.me();

      expect(result).toBeInstanceOf(User);
      expect(result.isBot()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a NotionAPIError with isNotFound() on a 404 response', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/users/unknown-id`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'User not found'), {
            status: 404,
          }),
        ),
      );

      try {
        await notion.users.retrieve('unknown-id');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotionAPIError);
        expect((error as NotionAPIError).isNotFound()).toBe(true);
      }
    });
  });
});
