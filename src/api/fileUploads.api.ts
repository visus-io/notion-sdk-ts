import type { NotionClient } from '../client';
import { fileUploadSchema, type NotionFileUpload } from '../schemas';
import { FileUpload } from '../models';

/**
 * Options for initiating a file upload.
 */
export interface InitiateFileUploadOptions {
  /** The filename */
  filename: string;

  /** The MIME type of the file */
  content_type: string;

  /** The size of the file in bytes */
  content_length: number;
}

/**
 * File data for uploading (can be Buffer, ArrayBuffer, Blob, or ReadableStream).
 */
export type FileData = Buffer | ArrayBuffer | Blob | ReadableStream;

/**
 * FileUploads API client for uploading files to Notion.
 */
export class FileUploadsAPI {
  constructor(private readonly client: NotionClient) {}

  /**
   * Initiate a file upload and get the upload URL.
   *
   * @param options - File metadata (filename, content type, size)
   * @returns The file upload object with upload URL
   *
   * @see https://developers.notion.com/reference/create-a-file-upload
   */
  async initiate(options: InitiateFileUploadOptions): Promise<FileUpload> {
    const response = await this.client.request<NotionFileUpload>({
      method: 'POST',
      path: '/file_uploads',
      body: options,
    });

    const parsed = fileUploadSchema.parse(response);
    return new FileUpload(parsed);
  }

  /**
   * Upload file data to the upload URL.
   * This is a direct PUT request to the upload URL (not through Notion API).
   *
   * @param uploadUrl - The upload URL from initiate()
   * @param fileData - The file data to upload
   * @param contentType - The MIME type of the file
   *
   * @see https://developers.notion.com/reference/upload-a-file
   */
  async upload(uploadUrl: string, fileData: FileData, contentType: string): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: fileData,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Complete the file upload after uploading to the URL.
   *
   * @param completeUrl - The complete URL from initiate()
   * @returns The completed file upload object
   *
   * @see https://developers.notion.com/reference/complete-a-file-upload
   */
  async complete(completeUrl: string): Promise<FileUpload> {
    const response = await this.client.request<NotionFileUpload>({
      method: 'POST',
      path: completeUrl.replace(/^https:\/\/api\.notion\.com\/v1/, ''),
      body: {},
    });

    const parsed = fileUploadSchema.parse(response);
    return new FileUpload(parsed);
  }

  /**
   * Helper method to upload a file in one call.
   * This combines initiate, upload, and complete steps.
   *
   * @param filename - The filename
   * @param fileData - The file data
   * @param contentType - The MIME type
   * @returns The completed file upload object
   */
  async uploadFile(filename: string, fileData: FileData, contentType: string): Promise<FileUpload> {
    // Get content length
    let contentLength: number;
    if (fileData instanceof Buffer) {
      contentLength = fileData.length;
    } else if (fileData instanceof ArrayBuffer) {
      contentLength = fileData.byteLength;
    } else if (fileData instanceof Blob) {
      contentLength = fileData.size;
    } else {
      throw new Error(
        'Cannot determine content length for ReadableStream. Use initiate/upload/complete separately.',
      );
    }

    // Step 1: Initiate upload
    const fileUpload = await this.initiate({
      filename,
      content_type: contentType,
      content_length: contentLength,
    });

    // Step 2: Upload file
    await this.upload(fileUpload.uploadUrl, fileData, contentType);

    // Step 3: Complete upload
    return this.complete(fileUpload.completeUrl);
  }

  /**
   * Get the status of a file upload.
   *
   * @param fileUploadId - The ID of the file upload
   * @returns The file upload object with current status
   *
   * @see https://developers.notion.com/reference/retrieve-a-file-upload
   */
  async retrieve(fileUploadId: string): Promise<FileUpload> {
    const response = await this.client.request<NotionFileUpload>({
      method: 'GET',
      path: `/file_uploads/${fileUploadId}`,
    });

    const parsed = fileUploadSchema.parse(response);
    return new FileUpload(parsed);
  }
}
