import type { NotionErrorCode, NotionErrorResponse } from '../errors';
import type {
  AgentInsights,
  NotionAgent,
  NotionBlock,
  NotionComment,
  NotionDatabase,
  NotionDataSource,
  NotionFileUpload,
  NotionPage,
  NotionRichText,
  NotionSession,
  NotionUser,
  SyncMetadata,
} from '../schemas';

const PERSON_USER_ID = '323e4567-e89b-12d3-a456-426614174000';

function buildRichText(content: string): NotionRichText {
  return [
    {
      type: 'text',
      text: { content, link: null },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: content,
      href: null,
    },
  ];
}

function buildPartialUser(id: string = PERSON_USER_ID): NotionUser {
  return { object: 'user', id };
}

/** Build a realistic Notion page API response. */
export function buildPageResponse(overrides: Partial<NotionPage> = {}): NotionPage {
  return {
    object: 'page',
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: buildPartialUser(),
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: buildPartialUser(),
    in_trash: false,
    icon: null,
    cover: null,
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: {
        id: 'title',
        type: 'title',
        title: buildRichText('Test Page'),
      },
    },
    url: 'https://notion.so/test',
    public_url: null,
    ...overrides,
  };
}

/** Build a realistic Notion block API response (paragraph block). */
export function buildBlockResponse(overrides: Partial<NotionBlock> = {}): NotionBlock {
  return {
    object: 'block',
    id: '123e4567-e89b-12d3-a456-426614174000',
    parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
    type: 'paragraph',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: buildPartialUser(),
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: buildPartialUser(),
    in_trash: false,
    has_children: false,
    paragraph: {
      rich_text: buildRichText('Test paragraph'),
      color: 'default',
    },
    ...overrides,
  };
}

/** Build a realistic Notion database API response. */
export function buildDatabaseResponse(overrides: Partial<NotionDatabase> = {}): NotionDatabase {
  return {
    object: 'database',
    id: '123e4567-e89b-12d3-a456-426614174000',
    data_sources: [],
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: buildPartialUser(),
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: buildPartialUser(),
    title: buildRichText('Test Database'),
    description: [],
    icon: null,
    cover: null,
    parent: { type: 'page_id', page_id: '523e4567-e89b-12d3-a456-426614174000' },
    url: 'https://notion.so/test-database',
    in_trash: false,
    is_inline: false,
    public_url: null,
    ...overrides,
  };
}

/** Build a realistic Notion data source API response. */
export function buildDataSourceResponse(
  overrides: Partial<NotionDataSource> = {},
): NotionDataSource {
  return {
    object: 'data_source',
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: buildPartialUser(),
    last_edited_time: '2023-01-02T00:00:00.000Z',
    last_edited_by: buildPartialUser(),
    title: buildRichText('Test Data Source'),
    description: [],
    icon: null,
    cover: null,
    properties: {
      Name: { id: 'title', name: 'Name', type: 'title', title: {} },
    },
    parent: { type: 'database_id', database_id: '523e4567-e89b-12d3-a456-426614174000' },
    database_parent: { type: 'workspace', workspace: true },
    url: 'https://notion.so/test-data-source',
    in_trash: false,
    is_inline: false,
    public_url: null,
    ...overrides,
  };
}

/** Build realistic sync metadata for a GitHub-synced data source. */
export function buildSyncMetadata(overrides: Partial<SyncMetadata> = {}): SyncMetadata {
  return {
    external_database_sync: {
      sync_id: '623e4567-e89b-12d3-a456-426614174000',
      provider: 'github',
    },
    synced_collection_key: 'issues',
    owner_user_id: '723e4567-e89b-12d3-a456-426614174000',
    resource: 'octo-org/octo-repo',
    health: {
      paused: false,
      stage: 'steady',
      ok: true,
      checks: {
        sync_version_updated_at: '2026-11-01T00:00:00.000Z',
        last_execution_succeeded_at: '2026-11-05T12:00:00.000Z',
        delta_synced_through_at: '2026-11-05T11:59:00.000Z',
      },
    },
    ...overrides,
  };
}

/** Build a realistic Notion person-user API response. */
export function buildUserResponse(overrides: Partial<NotionUser> = {}): NotionUser {
  return {
    object: 'user',
    id: PERSON_USER_ID,
    type: 'person',
    person: { email: 'test@example.com' },
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    ...overrides,
  };
}

/** Build a realistic Notion bot-user API response. */
export function buildBotUserResponse(overrides: Partial<NotionUser> = {}): NotionUser {
  return {
    object: 'user',
    id: '223e4567-e89b-12d3-a456-426614174000',
    type: 'bot',
    bot: {
      owner: { type: 'workspace', workspace: true },
      workspace_name: 'Test Workspace',
    },
    name: 'Test Bot',
    avatar_url: null,
    ...overrides,
  };
}

/** Build a realistic Notion comment API response. */
export function buildCommentResponse(overrides: Partial<NotionComment> = {}): NotionComment {
  return {
    object: 'comment',
    id: '123e4567-e89b-12d3-a456-426614174000',
    parent: { type: 'page_id', page_id: '223e4567-e89b-12d3-a456-426614174000' },
    discussion_id: '423e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    created_by: buildPartialUser(),
    last_edited_time: '2023-01-02T00:00:00.000Z',
    rich_text: buildRichText('This is a comment'),
    ...overrides,
  };
}

/** Build a realistic Notion file upload API response. */
export function buildFileUploadResponse(
  overrides: Partial<NotionFileUpload> = {},
): NotionFileUpload {
  return {
    object: 'file_upload',
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    expiry_time: '2023-01-02T00:00:00.000Z',
    status: 'pending',
    filename: 'test-file.pdf',
    content_type: 'application/pdf',
    content_length: 1024,
    upload_url: 'https://upload.notion.test/notion-uploads/test-upload',
    complete_url:
      'https://api.notion.test/v1/file_uploads/123e4567-e89b-12d3-a456-426614174000/complete',
    file_import_result: '',
    ...overrides,
  };
}

/** Build a Notion API error response body. */
export function buildErrorBody(
  status: number,
  code: NotionErrorCode,
  message: string,
): NotionErrorResponse {
  return { object: 'error', status, code, message };
}

export const AGENT_ID = '1f0c7c06-781b-4987-9986-5c8dd3028013';
export const SESSION_ID = '2a1c7c06-781b-4987-9986-5c8dd3028014';

/** Build a realistic Custom Agent API response. */
export function buildAgentResponse(overrides: Partial<NotionAgent> = {}): NotionAgent {
  return {
    object: 'agent',
    id: AGENT_ID,
    agent_type: 'custom_agent',
    name: 'Triage Agent',
    description: 'Sorts incoming requests',
    icon: null,
    instructions_page_id: null,
    model: { mode: 'auto' },
    status: 'active',
    pause_reason: null,
    created_by: { type: 'user', id: PERSON_USER_ID },
    agent_version: { id: 'ver-1', number: 3, published_at: '2026-10-01T00:00:00.000Z' },
    has_unpublished_changes: false,
    created_time: '2026-09-01T00:00:00.000Z',
    last_edited_time: '2026-10-01T00:00:00.000Z',
    last_run_at: '2026-11-01T12:00:00.000Z',
    credit_limit: 500,
    triggers: [{ type: 'schedule', enabled: true }],
    connections: [{ type: 'notion', name: 'Notion', account: null, permissions: [] }],
    is_favorited: false,
    ...overrides,
  };
}

/** Build the personal agent (Notion AI) API response. */
export function buildPersonalAgentResponse(overrides: Partial<NotionAgent> = {}): NotionAgent {
  return {
    object: 'agent',
    id: 'notion_ai',
    agent_type: 'notion_ai',
    name: 'Notion AI',
    description: null,
    icon: null,
    instructions_page_id: null,
    model: { mode: 'pinned', id: 'model-1' },
    status: 'active',
    pause_reason: null,
    created_by: null,
    agent_version: null,
    created_time: null,
    last_edited_time: null,
    last_run_at: null,
    credit_limit: null,
    connections: [],
    triggers: [],
    ...overrides,
  };
}

/** Build a realistic session API response, as Retrieve a session returns it. */
export function buildSessionResponse(overrides: Partial<NotionSession> = {}): NotionSession {
  return {
    object: 'session',
    id: SESSION_ID,
    agent_id: AGENT_ID,
    title: 'Weekly summary',
    status: 'completed',
    created_at: '2026-11-01T12:00:00.000Z',
    updated_at: '2026-11-01T12:01:00.000Z',
    created_by: { id: PERSON_USER_ID, type: 'user' },
    agent_version: null,
    models: { type: 'auto' },
    credits_used: 1.25,
    runs_completed: 1,
    message_count: 2,
    ...overrides,
  };
}

/** Build a session event API response of one type. */
export function buildSessionEventResponse(
  type: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const base = {
    object: 'session_event',
    id: `evt-${type}`,
    session_id: SESSION_ID,
    sequence: 1,
    created_at: '2026-11-01T12:00:30.000Z',
    type,
  };
  const byType: Record<string, Record<string, unknown>> = {
    'user.message': {
      content: [{ type: 'text', text: 'Summarize this week.' }],
      created_by: { id: PERSON_USER_ID, type: 'user' },
      metadata: null,
    },
    'agent.message': {
      content: [{ type: 'text', text: 'Here is the summary.' }],
      created_by: { id: AGENT_ID, type: 'bot' },
      metadata: { model: 'model-1' },
    },
    'agent.thinking': { content: [{ type: 'text', text: 'Reading pages' }] },
    'agent.tool_use': { tool_name: 'search' },
    'agent.tool_result': { tool_use_id: 'tool-1', tool_name: 'search', is_error: false },
    'session.status': { status: 'completed' },
  };
  return { ...base, ...(byType[type] ?? {}), ...overrides };
}

/** Build an agent insights API response. */
export function buildAgentInsightsResponse(overrides: Partial<AgentInsights> = {}): AgentInsights {
  return {
    object: 'agent_insights',
    id: AGENT_ID,
    name: 'Triage Agent',
    agent_type: 'custom_agent',
    status: 'active',
    pause_reason: null,
    created_by: { id: PERSON_USER_ID, type: 'user' },
    total_credits_used: 42,
    credit_limit: 500,
    runs_completed: 7,
    ...overrides,
  };
}

/**
 * Build a server-sent events body. Each envelope becomes one `data:` frame.
 * Pass a string to send a raw line, for example a comment or a malformed frame.
 */
export function buildSseBody(frames: (Record<string, unknown> | string)[]): string {
  return frames
    .map((frame) => (typeof frame === 'string' ? frame : `data: ${JSON.stringify(frame)}\n\n`))
    .join('');
}
