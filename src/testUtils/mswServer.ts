import { setupServer } from 'msw/node';

/** Base URL used by integration tests; never resolves to a real host. */
export const NOTION_TEST_BASE_URL = 'https://api.notion.test';

/** Auth token used by integration tests. */
export const NOTION_TEST_AUTH_TOKEN = 'test-integration-token';

/** Second origin simulating Notion's S3-backed file upload URLs. */
export const NOTION_TEST_UPLOAD_BASE_URL = 'https://upload.notion.test';

/** Shared MSW server instance for integration tests. */
export const server = setupServer();
