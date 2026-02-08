import { BaseModel } from './base.model';
import { fileUploadSchema, type NotionFileUpload } from '../schemas';

/**
 * FileUpload model class with helper methods.
 */
export class FileUpload extends BaseModel<NotionFileUpload> {
  constructor(data: NotionFileUpload) {
    super(data, fileUploadSchema);
  }

  /**
   * Returns "file_upload" - the object type.
   */
  get object(): 'file_upload' {
    return this.data.object;
  }

  /**
   * Returns the file upload ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Returns the created time as a Date object.
   */
  get createdTime(): Date {
    return new Date(this.data.created_time);
  }

  /**
   * Returns the expiry time as a Date object (or null if not set).
   */
  get expiryTime(): Date | null {
    return this.data.expiry_time ? new Date(this.data.expiry_time) : null;
  }

  /**
   * Returns the upload status.
   */
  get status(): 'pending' | 'uploaded' | 'expired' | 'failed' {
    return this.data.status;
  }

  /**
   * Returns the filename.
   */
  get filename(): string {
    return this.data.filename;
  }

  /**
   * Returns the content type (MIME type).
   */
  get contentType(): string | null {
    return this.data.content_type;
  }

  /**
   * Returns the content length in bytes.
   */
  get contentLength(): number | null {
    return this.data.content_length;
  }

  /**
   * Returns the upload URL for uploading the file.
   */
  get uploadUrl(): string {
    return this.data.upload_url;
  }

  /**
   * Returns the complete URL for finalizing the upload.
   */
  get completeUrl(): string {
    return this.data.complete_url;
  }

  /**
   * Returns the file import result.
   */
  get fileImportResult(): string {
    return this.data.file_import_result;
  }

  /**
   * Checks if the upload is pending.
   */
  isPending(): boolean {
    return this.data.status === 'pending';
  }

  /**
   * Checks if the upload is complete.
   */
  isUploaded(): boolean {
    return this.data.status === 'uploaded';
  }

  /**
   * Checks if the upload has expired.
   */
  isExpired(): boolean {
    return this.data.status === 'expired';
  }

  /**
   * Checks if the upload has failed.
   */
  isFailed(): boolean {
    return this.data.status === 'failed';
  }
}
