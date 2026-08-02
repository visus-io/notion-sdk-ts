import type { NotionErrorCode, NotionErrorResponse } from '../errors';
import type {
  NotionBlock,
  NotionComment,
  NotionDatabase,
  NotionDataSource,
  NotionFileUpload,
  NotionPage,
  NotionRichText,
  NotionUser,
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
