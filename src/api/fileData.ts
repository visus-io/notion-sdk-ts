/**
 * File data for uploading. Accepts a `Buffer`, `Uint8Array`, `ArrayBuffer`, or
 * `Blob`. The upload endpoint uses `multipart/form-data`, so the SDK cannot
 * stream a `ReadableStream` without buffering it in full. Read a stream into a
 * `Buffer` yourself before you call `upload()`.
 */
export type FileData = Buffer | Uint8Array | ArrayBuffer | Blob;

/**
 * Convert file data into a `Blob` for a multipart request body. Return a `Blob` unchanged.
 */
export function toBlob(fileData: FileData, contentType: string): Blob {
  if (fileData instanceof Blob) {
    return fileData;
  }

  return new Blob([new Uint8Array(fileData as ArrayBuffer)], { type: contentType });
}

/**
 * Return the size of file data in bytes.
 *
 * @throws {TypeError} If `fileData` is not a `Buffer`, `Uint8Array`, `ArrayBuffer`, or `Blob`.
 */
export function byteLengthOf(fileData: FileData): number {
  if (fileData instanceof Blob) {
    return fileData.size;
  }
  if (fileData instanceof Uint8Array || fileData instanceof ArrayBuffer) {
    return fileData.byteLength;
  }
  throw new TypeError(
    'Unsupported file data type. Pass a Buffer, Uint8Array, ArrayBuffer, or Blob.',
  );
}
