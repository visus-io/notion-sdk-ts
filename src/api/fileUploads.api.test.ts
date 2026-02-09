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
    it('should upload file data to the upload URL', async () => {
      const mockResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const fileData = Buffer.from('test file content');
      await fileUploadsAPI.upload(
        'https://s3.amazonaws.com/notion-uploads/test-upload',
        fileData,
        'application/pdf',
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://s3.amazonaws.com/notion-uploads/test-upload',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/pdf',
          },
          body: fileData,
        },
      );
    });

    it('should upload file with different content types', async () => {
      const mockResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const fileData = Buffer.from('image data');
      await fileUploadsAPI.upload('https://upload-url.com/upload', fileData, 'image/png');

      expect(mockFetch).toHaveBeenCalledWith('https://upload-url.com/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
        },
        body: fileData,
      });
    });

    it('should throw error when upload fails', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const fileData = Buffer.from('test file content');

      await expect(
        fileUploadsAPI.upload('https://upload-url.com/upload', fileData, 'application/pdf'),
      ).rejects.toThrow('File upload failed: 403 Forbidden');
    });

    it('should handle ArrayBuffer upload', async () => {
      const mockResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const fileData = new ArrayBuffer(100);
      await fileUploadsAPI.upload(
        'https://upload-url.com/upload',
        fileData,
        'application/octet-stream',
      );

      expect(mockFetch).toHaveBeenCalledWith('https://upload-url.com/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: fileData,
      });
    });

    it('should handle Blob upload', async () => {
      const mockResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const fileData = new Blob(['test content'], { type: 'text/plain' });
      await fileUploadsAPI.upload('https://upload-url.com/upload', fileData, 'text/plain');

      expect(mockFetch).toHaveBeenCalledWith('https://upload-url.com/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
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

  describe('retrieve', () => {
    it('should retrieve a file upload by ID', async () => {
      vi.mocked(mockClient.request).mockResolvedValue(mockFileUploadResponse);

      const result = await fileUploadsAPI.retrieve('123e4567-e89b-12d3-a456-426614174000');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/file_uploads/123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result).toBeInstanceOf(FileUpload);
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should retrieve file upload status', async () => {
      const uploadedResponse = { ...mockFileUploadResponse, status: 'uploaded' };
      vi.mocked(mockClient.request).mockResolvedValue(uploadedResponse);

      const result = await fileUploadsAPI.retrieve('123e4567-e89b-12d3-a456-426614174000');

      expect(result.status).toBe('uploaded');
    });
  });

  describe('uploadFile', () => {
    it('should upload a complete file using Buffer', async () => {
      // Mock initiate response
      vi.mocked(mockClient.request)
        .mockResolvedValueOnce(mockFileUploadResponse)
        .mockResolvedValueOnce(mockUploadedFileUploadResponse);

      // Mock upload response
      const mockUploadResponse = { ok: true, status: 200, statusText: 'OK' } as Response;
      mockFetch.mockResolvedValue(mockUploadResponse);

      const fileData = Buffer.from('test file content');
      const result = await fileUploadsAPI.uploadFile('test.pdf', fileData, 'application/pdf');

      // Verify initiate was called
      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: '/file_uploads',
        body: {
          filename: 'test.pdf',
          content_type: 'application/pdf',
          content_length: fileData.length,
        },
      });

      // Verify upload was called
      expect(mockFetch).toHaveBeenCalledWith(mockFileUploadResponse.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: fileData,
      });

      // Verify complete was called
      expect(mockClient.request).toHaveBeenNthCalledWith(2, {
        method: 'POST',
        path: '/file_uploads/123e4567-e89b-12d3-a456-426614174000/complete',
        body: {},
      });

      expect(result).toBeInstanceOf(FileUpload);
      expect(result.status).toBe('uploaded');
    });

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
