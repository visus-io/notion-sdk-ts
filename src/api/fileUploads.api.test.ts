import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileUploadsAPI } from './fileUploads.api';
import type { NotionClient } from '../client';
import { FileUpload } from '../models';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FileUploadsAPI', () => {
  const mockClient = {
    request: vi.fn(),
  } as unknown as NotionClient;

  const fileUploadsAPI = new FileUploadsAPI(mockClient);

  const mockFileUploadResponse = {
    object: 'file_upload',
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_time: '2023-01-01T00:00:00.000Z',
    expiry_time: '2023-01-02T00:00:00.000Z',
    filename: 'test-file.pdf',
    content_type: 'application/pdf',
    content_length: 1024,
    status: 'pending' as const,
    upload_url: 'https://s3.amazonaws.com/notion-uploads/test-upload',
    complete_url:
      'https://api.notion.com/v1/file_uploads/123e4567-e89b-12d3-a456-426614174000/complete',
    file_import_result: '',
  };

  const mockUploadedFileUploadResponse = {
    ...mockFileUploadResponse,
    status: 'uploaded' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiate', () => {
    it('should initiate a file upload', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockFileUploadResponse);

      const result = await fileUploadsAPI.initiate({
        filename: 'test-file.pdf',
        content_type: 'application/pdf',
        content_length: 1024,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/file_uploads',
        body: {
          filename: 'test-file.pdf',
          content_type: 'application/pdf',
          content_length: 1024,
        },
      });
      expect(result).toBeInstanceOf(FileUpload);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.status).toBe('pending');
      expect(result.uploadUrl).toBe('https://s3.amazonaws.com/notion-uploads/test-upload');
    });

    it('should initiate upload for various file types', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockFileUploadResponse);

      await fileUploadsAPI.initiate({
        filename: 'image.png',
        content_type: 'image/png',
        content_length: 2048,
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/file_uploads',
        body: {
          filename: 'image.png',
          content_type: 'image/png',
          content_length: 2048,
        },
      });
    });
  });

  describe('upload', () => {
    it.each([
      {
        desc: 'Buffer',
        contentType: 'image/png',
        fileData: Buffer.from('image data') as BodyInit,
      },
      {
        desc: 'ArrayBuffer',
        contentType: 'application/octet-stream',
        fileData: new ArrayBuffer(100) as BodyInit,
      },
      {
        desc: 'Blob',
        contentType: 'text/plain',
        fileData: new Blob(['test content'], { type: 'text/plain' }) as BodyInit,
      },
    ])('should upload $desc file data', async ({ contentType, fileData }) => {
      const mockResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await fileUploadsAPI.upload('https://upload-url.com/upload', fileData, contentType);

      expect(mockFetch).toHaveBeenCalledWith('https://upload-url.com/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: fileData,
      });
    });
  });

  describe('complete', () => {
    it('should complete a file upload', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockUploadedFileUploadResponse);

      const result = await fileUploadsAPI.complete(
        'https://api.notion.com/v1/file_uploads/123e4567-e89b-12d3-a456-426614174000/complete',
      );

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/file_uploads/123e4567-e89b-12d3-a456-426614174000/complete',
        body: {},
      });
      expect(result).toBeInstanceOf(FileUpload);
      expect(result.status).toBe('uploaded');
    });

    it('should handle complete URL path extraction', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockUploadedFileUploadResponse);

      await fileUploadsAPI.complete('https://api.notion.com/v1/file_uploads/abc123/complete');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/file_uploads/abc123/complete',
        body: {},
      });
    });
  });

  describe('uploadFile', () => {
    it('should upload a complete file using ArrayBuffer', async () => {
      vi.mocked(mockClient.request)
        .mockResolvedValueOnce(mockFileUploadResponse)
        .mockResolvedValueOnce(mockUploadedFileUploadResponse);

      const mockUploadResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockUploadResponse);

      const fileData = new ArrayBuffer(256);
      await fileUploadsAPI.uploadFile('data.bin', fileData, 'application/octet-stream');

      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: '/file_uploads',
        body: {
          filename: 'data.bin',
          content_type: 'application/octet-stream',
          content_length: 256,
        },
      });
    });

    it('should upload a complete file using Blob', async () => {
      vi.mocked(mockClient.request)
        .mockResolvedValueOnce(mockFileUploadResponse)
        .mockResolvedValueOnce(mockUploadedFileUploadResponse);

      const mockUploadResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockUploadResponse);

      const fileData = new Blob(['hello world'], { type: 'text/plain' });
      await fileUploadsAPI.uploadFile('hello.txt', fileData, 'text/plain');

      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: '/file_uploads',
        body: {
          filename: 'hello.txt',
          content_type: 'text/plain',
          content_length: fileData.size,
        },
      });
    });

    it('should throw error for ReadableStream without content length', async () => {
      const mockStream = new ReadableStream() as ReadableStream;

      await expect(
        fileUploadsAPI.uploadFile('stream.dat', mockStream, 'application/octet-stream'),
      ).rejects.toThrow('Cannot determine content length for ReadableStream');
    });
  });
});
