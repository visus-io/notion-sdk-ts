import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotionAPIError } from '../errors';
import { Agent, AsyncTask } from '../models';
import { Notion } from '../notion';
import {
  AGENT_ID,
  buildAgentInsightsResponse,
  buildAgentResponse,
  buildErrorBody,
  buildPersonalAgentResponse,
} from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import { NOTION_TEST_AUTH_TOKEN, NOTION_TEST_BASE_URL, server } from '../testUtils/mswServer';

useMswServer();

const AGENTS_URL = `${NOTION_TEST_BASE_URL}/v1/agents`;

describe('AgentsAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  // ---------------------------------------------------------------------------
  // query
  // ---------------------------------------------------------------------------

  describe('query', () => {
    it('should POST the query body and parse a paginated list of agents', async () => {
      let body: unknown;
      server.use(
        http.post(`${AGENTS_URL}/query`, async ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          body = await request.json();
          return HttpResponse.json({
            object: 'list',
            type: 'agent',
            agent: {},
            results: [buildAgentResponse(), buildPersonalAgentResponse()],
            has_more: true,
            next_cursor: 'cursor-2',
          });
        }),
      );

      const result = await notion.agents.query({
        query: 'triage',
        filter: { and: [{ property: 'status', status: { in: ['active'] } }] },
        sorts: [{ property: 'last_run_at', direction: 'descending' }],
        page_size: 10,
        verbose: true,
      });

      expect(body).toEqual({
        query: 'triage',
        filter: { and: [{ property: 'status', status: { in: ['active'] } }] },
        sorts: [{ property: 'last_run_at', direction: 'descending' }],
        page_size: 10,
        verbose: true,
      });
      expect(result.type).toBe('agent');
      expect(result.results[0]).toBeInstanceOf(Agent);
      expect(result.results[1].isPersonalAgent()).toBe(true);
      expect(result.next_cursor).toBe('cursor-2');
    });

    it('should send an empty body when there are no options', async () => {
      let body: unknown;
      server.use(
        http.post(`${AGENTS_URL}/query`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            object: 'list',
            type: 'agent',
            results: [],
            has_more: false,
            next_cursor: null,
          });
        }),
      );

      await notion.agents.query();

      expect(body).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // retrieve / update / delete
  // ---------------------------------------------------------------------------

  describe('retrieve', () => {
    it('should GET the agent and send verbose as a query param', async () => {
      server.use(
        http.get(`${AGENTS_URL}/${AGENT_ID}`, ({ request }) => {
          expect(new URL(request.url).searchParams.get('verbose')).toBe('true');
          return HttpResponse.json(buildAgentResponse({ instructions: 'Be brief.' }));
        }),
      );

      const agent = await notion.agents.retrieve(AGENT_ID, { verbose: true });

      expect(agent).toBeInstanceOf(Agent);
      expect(agent.instructions).toBe('Be brief.');
    });

    it('should surface a 404 for notion_ai with a connection token', async () => {
      server.use(
        http.get(`${AGENTS_URL}/notion_ai`, () =>
          HttpResponse.json(buildErrorBody(404, 'object_not_found', 'Not found'), {
            status: 404,
          }),
        ),
      );

      const error = await notion.agents.retrieve('notion_ai').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(NotionAPIError);
      expect((error as NotionAPIError).isNotFound()).toBe(true);
    });
  });

  describe('update', () => {
    it('should PATCH only the defined fields', async () => {
      let body: unknown;
      server.use(
        http.patch(`${AGENTS_URL}/${AGENT_ID}`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(buildAgentResponse({ status: 'disabled' }));
        }),
      );

      const agent = await notion.agents.update(AGENT_ID, {
        status: 'disabled',
        model: { mode: 'pinned', id: 'model-1' },
        name: undefined,
      });

      expect(body).toEqual({ status: 'disabled', model: { mode: 'pinned', id: 'model-1' } });
      expect(agent.status).toBe('disabled');
    });
  });

  describe('delete', () => {
    it('should DELETE the agent and parse the result', async () => {
      server.use(
        http.delete(`${AGENTS_URL}/${AGENT_ID}`, () =>
          HttpResponse.json({
            agent_id: AGENT_ID,
            status: 'deleted',
            deleted_at: '2026-11-15T00:00:00.000Z',
          }),
        ),
      );

      const result = await notion.agents.delete(AGENT_ID);

      expect(result).toEqual({
        agent_id: AGENT_ID,
        status: 'deleted',
        deleted_at: '2026-11-15T00:00:00.000Z',
      });
    });

    it('should surface a 403 restricted_resource for a connection token', async () => {
      server.use(
        http.delete(`${AGENTS_URL}/${AGENT_ID}`, () =>
          HttpResponse.json(buildErrorBody(403, 'restricted_resource', 'Forbidden'), {
            status: 403,
          }),
        ),
      );

      await expect(notion.agents.delete(AGENT_ID)).rejects.toBeInstanceOf(NotionAPIError);
    });
  });

  // ---------------------------------------------------------------------------
  // credit limit / batch / insights
  // ---------------------------------------------------------------------------

  describe('updateCreditLimit', () => {
    it('should PATCH the credit limit, including null to clear it', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.patch(`${AGENTS_URL}/${AGENT_ID}/credit_limit`, async ({ request }) => {
          const body = (await request.json()) as { credit_limit: number | null };
          bodies.push(body);
          return HttpResponse.json({
            agent_id: AGENT_ID,
            credit_limit: body.credit_limit,
            last_edited_time: '2026-11-15T00:00:00.000Z',
          });
        }),
      );

      const set = await notion.agents.updateCreditLimit(AGENT_ID, 500);
      const cleared = await notion.agents.updateCreditLimit(AGENT_ID, null);

      expect(bodies).toEqual([{ credit_limit: 500 }, { credit_limit: null }]);
      expect(set.credit_limit).toBe(500);
      expect(cleared.credit_limit).toBeNull();
    });
  });

  describe('batch', () => {
    it('should POST the operations and return an async task that asyncTasks can poll', async () => {
      const taskId = '323e4567-e89b-12d3-a456-426614174999';
      let body: unknown;
      server.use(
        http.post(`${AGENTS_URL}/batch`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            object: 'async_task',
            id: taskId,
            status: 'queued',
            status_url: `${NOTION_TEST_BASE_URL}/v1/async_tasks/${taskId}`,
            created_time: '2026-11-15T00:00:00.000Z',
            operation: { surface: 'agents', name: 'batch_manage_agents' },
            poll_after_seconds: 1,
          });
        }),
      );

      const operations = [
        {
          action: 'update_status' as const,
          agent_id: AGENT_ID,
          fields: { status: 'disabled' as const },
        },
        { action: 'delete' as const, agent_id: AGENT_ID },
      ];
      const task = await notion.agents.batch(operations);

      expect(body).toEqual({ operations });
      expect(task).toBeInstanceOf(AsyncTask);
      expect(task.operation.surface).toBe('agents');
    });
  });

  describe('insights', () => {
    it('should GET insights with epoch-second query params', async () => {
      let params: URLSearchParams | undefined;
      server.use(
        http.get(`${AGENTS_URL}/${AGENT_ID}/insights`, ({ request }) => {
          params = new URL(request.url).searchParams;
          return HttpResponse.json(buildAgentInsightsResponse());
        }),
      );

      const insights = await notion.agents.insights(AGENT_ID, {
        start_time: new Date('2026-11-01T00:00:00.000Z'),
        end_time: 1_763_164_800,
      });

      expect(params?.get('start_time')).toBe(String(Date.parse('2026-11-01T00:00:00.000Z') / 1000));
      expect(params?.get('end_time')).toBe('1763164800');
      expect(insights.total_credits_used).toBe(42);
    });

    it('should send no query params for the current billing period', async () => {
      server.use(
        http.get(`${AGENTS_URL}/notion_ai/insights`, ({ request }) => {
          expect(new URL(request.url).search).toBe('');
          return HttpResponse.json(
            buildAgentInsightsResponse({ id: 'notion_ai', agent_type: 'notion_ai' }),
          );
        }),
      );

      const insights = await notion.agents.insights('notion_ai');

      expect(insights.agent_type).toBe('notion_ai');
    });
  });
});
