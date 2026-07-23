import { describe, expect, it } from 'vitest';
import { FileUpload } from '.';

describe('FileUpload', () => {
  it('should create a valid file upload model', () => {
    const fileUploadData = {
      object: 'file_upload' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      expiry_time: '2023-01-02T00:00:00.000Z',
      status: 'pending' as const,
      filename: 'document.pdf',
      content_type: 'application/pdf',
      content_length: 1024000,
      upload_url: 'https://example.com/upload',
      complete_url: 'https://example.com/complete',
      file_import_result: 'file://path/to/file',
    };

    const fileUpload = new FileUpload(fileUploadData);
    expect(fileUpload.object).toBe('file_upload');
    expect(fileUpload.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(fileUpload.createdTime).toEqual(new Date('2023-01-01T00:00:00.000Z'));
    expect(fileUpload.expiryTime).toEqual(new Date('2023-01-02T00:00:00.000Z'));
    expect(fileUpload.status).toBe('pending');
    expect(fileUpload.filename).toBe('document.pdf');
    expect(fileUpload.contentType).toBe('application/pdf');
    expect(fileUpload.contentLength).toBe(1024000);
    expect(fileUpload.uploadUrl).toBe('https://example.com/upload');
    expect(fileUpload.completeUrl).toBe('https://example.com/complete');
    expect(fileUpload.fileImportResult).toBe('file://path/to/file');
  });

  it.each([
    { status: 'pending', isPending: true, isUploaded: false, isExpired: false, isFailed: false },
    { status: 'uploaded', isPending: false, isUploaded: true, isExpired: false, isFailed: false },
    { status: 'expired', isPending: false, isUploaded: false, isExpired: true, isFailed: false },
    { status: 'failed', isPending: false, isUploaded: false, isExpired: false, isFailed: true },
  ] as const)(
    'should identify $status uploads',
    ({ status, isPending, isUploaded, isExpired, isFailed }) => {
      const fileUploadData = {
        object: 'file_upload' as const,
        id: '123e4567-e89b-12d3-a456-426614174000',
        created_time: '2023-01-01T00:00:00.000Z',
        expiry_time: null,
        status,
        filename: 'test.txt',
        content_type: null,
        content_length: null,
        upload_url: 'https://example.com/upload',
        complete_url: 'https://example.com/complete',
        file_import_result: '',
      };

      const fileUpload = new FileUpload(fileUploadData);
      expect(fileUpload.isPending()).toBe(isPending);
      expect(fileUpload.isUploaded()).toBe(isUploaded);
      expect(fileUpload.isExpired()).toBe(isExpired);
      expect(fileUpload.isFailed()).toBe(isFailed);
    },
  );

  it('should handle null expiry time', () => {
    const fileUploadData = {
      object: 'file_upload' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      expiry_time: null,
      status: 'pending' as const,
      filename: 'test.txt',
      content_type: null,
      content_length: null,
      upload_url: 'https://example.com/upload',
      complete_url: 'https://example.com/complete',
      file_import_result: '',
    };

    const fileUpload = new FileUpload(fileUploadData);
    expect(fileUpload.expiryTime).toBeNull();
  });

  it('should handle null content type and length', () => {
    const fileUploadData = {
      object: 'file_upload' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      expiry_time: null,
      status: 'pending' as const,
      filename: 'test.txt',
      content_type: null,
      content_length: null,
      upload_url: 'https://example.com/upload',
      complete_url: 'https://example.com/complete',
      file_import_result: '',
    };

    const fileUpload = new FileUpload(fileUploadData);
    expect(fileUpload.contentType).toBeNull();
    expect(fileUpload.contentLength).toBeNull();
  });

  it('should serialize to JSON', () => {
    const fileUploadData = {
      object: 'file_upload' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_time: '2023-01-01T00:00:00.000Z',
      expiry_time: null,
      status: 'uploaded' as const,
      filename: 'image.png',
      content_type: 'image/png',
      content_length: 2048000,
      upload_url: 'https://example.com/upload',
      complete_url: 'https://example.com/complete',
      file_import_result: 'file://path/to/image.png',
    };

    const fileUpload = new FileUpload(fileUploadData);
    const json = fileUpload.toJSON();
    expect(json).toEqual(fileUploadData);
  });
});
