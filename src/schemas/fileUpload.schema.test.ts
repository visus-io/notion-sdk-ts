import { describe, expect, it } from 'vitest';
import { fileUploadSchema } from './fileUpload.schema';

describe('fileUploadSchema', () => {
  describe('valid file uploads', () => {
    it.each([
      {
        status: 'pending' as const,
        id: '123e4567-e89b-12d3-a456-426614174000',
        expiry_time: '2024-01-02T00:00:00.000Z' as string | null,
        filename: 'document.pdf',
        content_type: 'application/pdf' as string | null,
        content_length: 1024000 as number | null,
        file_import_result: 'pending',
      },
      {
        status: 'uploaded' as const,
        id: '123e4567-e89b-12d3-a456-426614174001',
        expiry_time: null,
        filename: 'image.png',
        content_type: 'image/png',
        content_length: 500000,
        file_import_result: 'success',
      },
      {
        status: 'expired' as const,
        id: '123e4567-e89b-12d3-a456-426614174002',
        expiry_time: '2024-01-01T01:00:00.000Z',
        filename: 'data.csv',
        content_type: 'text/csv',
        content_length: 2048,
        file_import_result: 'expired',
      },
      {
        status: 'failed' as const,
        id: '123e4567-e89b-12d3-a456-426614174003',
        expiry_time: null,
        filename: 'video.mp4',
        content_type: 'video/mp4',
        content_length: null,
        file_import_result: 'error',
      },
    ])(
      'should parse file upload with $status status',
      ({ status, id, expiry_time, filename, content_type, content_length, file_import_result }) => {
        const fileUpload = {
          object: 'file_upload' as const,
          id,
          created_time: '2024-01-01T00:00:00.000Z',
          expiry_time,
          status,
          filename,
          content_type,
          content_length,
          upload_url: 'https://upload.example.com/file',
          complete_url: 'https://api.example.com/complete',
          file_import_result,
        };

        const result = fileUploadSchema.safeParse(fileUpload);
        expect(result.success).toBe(true);
      },
    );

    it('should parse file upload with null content_type and content_length', () => {
      const fileUpload = {
        object: 'file_upload' as const,
        id: '123e4567-e89b-12d3-a456-426614174004',
        created_time: '2024-01-01T00:00:00.000Z',
        expiry_time: null,
        status: 'pending' as const,
        filename: 'unknown.bin',
        content_type: null,
        content_length: null,
        upload_url: 'https://upload.example.com/file',
        complete_url: 'https://api.example.com/complete',
        file_import_result: 'pending',
      };

      const result = fileUploadSchema.safeParse(fileUpload);
      expect(result.success).toBe(true);
    });
  });

  describe('validation', () => {
    it('should reject invalid object literal', () => {
      const fileUpload = {
        object: 'not-file-upload',
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_time: '2024-01-01T00:00:00.000Z',
        expiry_time: null,
        status: 'pending',
        filename: 'test.txt',
        content_type: null,
        content_length: null,
        upload_url: 'url',
        complete_url: 'url',
        file_import_result: 'result',
      };

      const result = fileUploadSchema.safeParse(fileUpload);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const fileUpload = {
        object: 'file_upload',
        id: 'not-a-uuid',
        created_time: '2024-01-01T00:00:00.000Z',
        expiry_time: null,
        status: 'pending',
        filename: 'test.txt',
        content_type: null,
        content_length: null,
        upload_url: 'url',
        complete_url: 'url',
        file_import_result: 'result',
      };

      const result = fileUploadSchema.safeParse(fileUpload);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format', () => {
      const fileUpload = {
        object: 'file_upload',
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_time: 'not-a-datetime',
        expiry_time: null,
        status: 'pending',
        filename: 'test.txt',
        content_type: null,
        content_length: null,
        upload_url: 'url',
        complete_url: 'url',
        file_import_result: 'result',
      };

      const result = fileUploadSchema.safeParse(fileUpload);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const fileUpload = {
        object: 'file_upload',
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_time: '2024-01-01T00:00:00.000Z',
        expiry_time: null,
        status: 'invalid_status',
        filename: 'test.txt',
        content_type: null,
        content_length: null,
        upload_url: 'url',
        complete_url: 'url',
        file_import_result: 'result',
      };

      const result = fileUploadSchema.safeParse(fileUpload);
      expect(result.success).toBe(false);
    });

    it('should trim filename', () => {
      const fileUpload = {
        object: 'file_upload' as const,
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_time: '2024-01-01T00:00:00.000Z',
        expiry_time: null,
        status: 'pending' as const,
        filename: '  test.txt  ',
        content_type: null,
        content_length: null,
        upload_url: 'https://upload.example.com',
        complete_url: 'https://complete.example.com',
        file_import_result: 'pending',
      };

      const result = fileUploadSchema.safeParse(fileUpload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filename).toBe('test.txt');
      }
    });
  });
});
