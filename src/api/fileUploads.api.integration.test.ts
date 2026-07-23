import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { FileUpload } from '../models';
import { Notion } from '../notion';
import { buildFileUploadResponse } from '../testUtils/fixtures';
import { useMswServer } from '../testUtils/mswLifecycle';
import {
  NOTION_TEST_AUTH_TOKEN,
  NOTION_TEST_BASE_URL,
  NOTION_TEST_UPLOAD_BASE_URL,
  server,
} from '../testUtils/mswServer';

useMswServer();

describe('FileUploadsAPI integration', () => {
  let notion: Notion;

  beforeEach(() => {
    notion = new Notion({ auth: NOTION_TEST_AUTH_TOKEN, baseUrl: NOTION_TEST_BASE_URL });
  });

  const fileUploadId = '123e4567-e89b-12d3-a456-426614174000';
  const uploadUrl = `${NOTION_TEST_UPLOAD_BASE_URL}/notion-uploads/${fileUploadId}`;
  const completeUrl = `${NOTION_TEST_BASE_URL}/v1/file_uploads/${fileUploadId}/complete`;

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  describe('initiate', () => {
    it('should initiate a file upload and return the upload URLs', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/file_uploads`, ({ request }) => {
          expect(request.headers.get('Notion-Version')).toBe('2026-03-11');
          return HttpResponse.json(
            buildFileUploadResponse({
              id: fileUploadId,
              upload_url: uploadUrl,
              complete_url: completeUrl,
            }),
          );
        }),
      );

      const result = await notion.fileUploads.initiate({
        filename: 'report.pdf',
        content_type: 'application/pdf',
        content_length: 1024,
      });

      expect(result).toBeInstanceOf(FileUpload);
      expect(result.uploadUrl).toBe(uploadUrl);
      expect(result.completeUrl).toBe(completeUrl);
    });
  });

  describe('retrieve', () => {
    it('should retrieve the current status of a file upload', async () => {
      server.use(
        http.get(`${NOTION_TEST_BASE_URL}/v1/file_uploads/${fileUploadId}`, () =>
          HttpResponse.json(buildFileUploadResponse({ id: fileUploadId, status: 'uploaded' })),
        ),
      );

      const result = await notion.fileUploads.retrieve(fileUploadId);

      expect(result).toBeInstanceOf(FileUpload);
      expect(result.isUploaded()).toBe(true);
    });
  });

  describe('uploadFile', () => {
    it('should drive the full initiate -> upload -> complete flow across two origins', async () => {
      let uploadedBody: ArrayBuffer | undefined;

      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/file_uploads`, () =>
          HttpResponse.json(
            buildFileUploadResponse({
              id: fileUploadId,
              status: 'pending',
              upload_url: uploadUrl,
              complete_url: completeUrl,
            }),
          ),
        ),
        // The SDK issues this PUT directly to the upload URL, bypassing NotionClient entirely.
        http.put(uploadUrl, async ({ request }) => {
          expect(request.headers.get('Content-Type')).toBe('application/pdf');
          uploadedBody = await request.arrayBuffer();
          return new HttpResponse(null, { status: 200 });
        }),
        http.post(completeUrl, () =>
          HttpResponse.json(
            buildFileUploadResponse({
              id: fileUploadId,
              status: 'uploaded',
              upload_url: uploadUrl,
              complete_url: completeUrl,
            }),
          ),
        ),
      );

      const fileData = Buffer.from('file contents');
      const result = await notion.fileUploads.uploadFile('report.pdf', fileData, 'application/pdf');

      expect(result).toBeInstanceOf(FileUpload);
      expect(result.isUploaded()).toBe(true);
      expect(Buffer.from(uploadedBody as ArrayBuffer).toString()).toBe('file contents');
    });
  });

  // ---------------------------------------------------------------------------
  // Error path
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('should throw a plain Error (not NotionAPIError) when the raw upload PUT fails', async () => {
      server.use(
        http.post(`${NOTION_TEST_BASE_URL}/v1/file_uploads`, () =>
          HttpResponse.json(
            buildFileUploadResponse({
              id: fileUploadId,
              upload_url: uploadUrl,
              complete_url: completeUrl,
            }),
          ),
        ),
        http.put(
          uploadUrl,
          () => new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' }),
        ),
      );

      const fileData = Buffer.from('file contents');

      await expect(
        notion.fileUploads.uploadFile('report.pdf', fileData, 'application/pdf'),
      ).rejects.toThrow('File upload failed: 500 Internal Server Error');
    });
  });
});
