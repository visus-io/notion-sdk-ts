import type { NotionClient } from '../client';
import { fileUploadSchema, type NotionFileUpload } from '../schemas';
import { FileUpload } from '../models';
import { TRUSTED } from '../models/base.model';
import { NotionValidationError } from '../validation';
import { BaseAPI } from './base.api';

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
 * File data for uploading. Accepts a `Buffer`, `Uint8Array`, `ArrayBuffer`, or
 * `Blob`. The upload endpoint uses `multipart/form-data`, so the SDK cannot
 * stream a `ReadableStream` without buffering it in full. Read a stream into a
 * `Buffer` yourself before you call `upload()`.
 */
export type FileData = Buffer | Uint8Array | ArrayBuffer | Blob;

/**
 * FileUploads API client for uploading files to Notion.
 *
 * @category File Uploads
 */
export class FileUploadsAPI extends BaseAPI<NotionFileUpload, FileUpload> {
  protected config = {
    schema: fileUploadSchema,
    ModelClass: FileUpload,
  };

  constructor(protected readonly client: NotionClient) {
    super(client);
  }

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
    return new FileUpload(parsed, TRUSTED);
  }

  /**
   * Upload file data to the upload URL from initiate(). Sends `multipart/form-data`
   * through the configured `NotionClient`.
   *
   * @param uploadUrl - The upload URL from initiate()
   * @param fileData - The file data to upload
   * @param contentType - The MIME type of the file
   * @param partNumber - The 1-based part number, for a multi-part upload of a file
   * larger than 20 MB. Pass a positive integer.
   * @throws {NotionValidationError} If `partNumber` is not a positive integer.
   * @throws {NotionAPIError} If the upload endpoint returns an error response.
   *
   * @see https://developers.notion.com/reference/upload-file
   */
  async upload(
    uploadUrl: string,
    fileData: FileData,
    contentType: string,
    partNumber?: number,
  ): Promise<void> {
    const form = new FormData();
    form.append('file', FileUploadsAPI.toBlob(fileData, contentType));

    if (partNumber !== undefined) {
      if (!Number.isInteger(partNumber) || partNumber < 1) {
        throw new NotionValidationError(
          `partNumber must be a positive integer (got ${partNumber})`,
        );
      }
      form.append('part_number', String(partNumber));
    }

    await this.client.sendFileUpload(uploadUrl, form);
  }

  /**
   * Convert file data into a `Blob` for the multipart request body.
   */
  private static toBlob(fileData: FileData, contentType: string): Blob {
    if (fileData instanceof Blob) {
      return fileData;
    }

    return new Blob([new Uint8Array(fileData as ArrayBuffer)], { type: contentType });
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
      path: FileUploadsAPI.toRequestPath(completeUrl),
      body: {},
    });

    const parsed = fileUploadSchema.parse(response);
    return new FileUpload(parsed, TRUSTED);
  }

  /**
   * Extract the request path from a complete URL.
   * Accept absolute URLs, for example `https://api.notion.com/v1/file_uploads/.../complete`.
   * Accept relative paths too, for example `/v1/file_uploads/.../complete` or the path alone.
   */
  private static toRequestPath(completeUrl: string): string {
    let path: string;

    try {
      path = new URL(completeUrl).pathname;
    } catch {
      path = completeUrl;
    }

    return path.replace(/^\/v1/, '');
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
    let contentLength: number;
    if (fileData instanceof Buffer) {
      contentLength = fileData.length;
    } else if (fileData instanceof Uint8Array) {
      contentLength = fileData.byteLength;
    } else if (fileData instanceof ArrayBuffer) {
      contentLength = fileData.byteLength;
    } else if (fileData instanceof Blob) {
      contentLength = fileData.size;
    } else {
      throw new TypeError(
        'Unsupported file data type. Pass a Buffer, Uint8Array, ArrayBuffer, or Blob.',
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
    return new FileUpload(parsed, TRUSTED);
  }
}
