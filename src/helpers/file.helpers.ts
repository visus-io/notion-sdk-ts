import type { NativeIconColor } from '../schemas/icon.schema';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

interface EmojiIcon {
  type: 'emoji';
  emoji: string;
}

interface ExternalRef {
  type: 'external';
  external: { url: string };
}

interface FileUploadRef {
  type: 'file_upload';
  file_upload: { id: string };
}

interface NativeIconRef {
  type: 'icon';
  icon: { name: string; color?: NativeIconColor };
}

interface CustomEmojiIconRef {
  type: 'custom_emoji';
  custom_emoji: { id: string };
}

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

/**
 * Create an emoji icon object.
 *
 * @example
 * ```ts
 * icon.emoji('🚀')
 * ```
 */
function emojiIcon(emoji: string): EmojiIcon {
  return { type: 'emoji', emoji };
}

/**
 * Create an external file icon object.
 *
 * @example
 * ```ts
 * icon.external('https://example.com/icon.png')
 * ```
 */
function externalIcon(url: string): ExternalRef {
  return { type: 'external', external: { url } };
}

/**
 * Create a file-upload icon object.
 *
 * @example
 * ```ts
 * icon.fileUpload('upload-id')
 * ```
 */
function fileUploadIcon(id: string): FileUploadRef {
  return { type: 'file_upload', file_upload: { id } };
}

/**
 * Create a native (icon-picker) icon object.
 *
 * @example
 * ```ts
 * icon.native('star circle', 'blue')
 * ```
 */
function nativeIcon(name: string, color?: NativeIconColor): NativeIconRef {
  return { type: 'icon', icon: { name, ...(color ? { color } : {}) } };
}

/**
 * Create a custom emoji icon object, referencing a workspace custom emoji by id.
 *
 * @example
 * ```ts
 * icon.customEmoji('emoji-id')
 * ```
 */
function customEmojiIcon(id: string): CustomEmojiIconRef {
  return { type: 'custom_emoji', custom_emoji: { id } };
}

/**
 * Helpers for constructing icon objects (emoji, external URL, file upload,
 * native icon, or custom emoji).
 *
 * @example
 * ```ts
 * import { icon } from '@visus-io/notion-sdk-ts';
 *
 * notion.pages.create({
 *   parent: { page_id: 'page-id' },
 *   icon: icon.emoji('📝'),
 *   // ...
 * });
 * ```
 */
export const icon = {
  emoji: emojiIcon,
  external: externalIcon,
  fileUpload: fileUploadIcon,
  native: nativeIcon,
  customEmoji: customEmojiIcon,
};

// ---------------------------------------------------------------------------
// Cover helpers
// ---------------------------------------------------------------------------

/**
 * Create an external cover image object.
 *
 * @example
 * ```ts
 * cover.external('https://example.com/banner.jpg')
 * ```
 */
function externalCover(url: string): ExternalRef {
  return { type: 'external', external: { url } };
}

/**
 * Create a file-upload cover image object.
 *
 * @example
 * ```ts
 * cover.fileUpload('upload-id')
 * ```
 */
function fileUploadCover(id: string): FileUploadRef {
  return { type: 'file_upload', file_upload: { id } };
}

/**
 * Helpers for constructing cover image objects.
 *
 * @example
 * ```ts
 * import { cover } from '@visus-io/notion-sdk-ts';
 *
 * notion.pages.create({
 *   parent: { page_id: 'page-id' },
 *   cover: cover.external('https://example.com/banner.jpg'),
 *   // ...
 * });
 * ```
 */
export const cover = {
  external: externalCover,
  fileUpload: fileUploadCover,
};

// ---------------------------------------------------------------------------
// General file object helpers
// ---------------------------------------------------------------------------

/**
 * Create an external file reference.
 *
 * @example
 * ```ts
 * notionFile.external('https://example.com/doc.pdf')
 * ```
 */
function externalFile(url: string): ExternalRef {
  return { type: 'external', external: { url } };
}

/**
 * Create a file-upload reference.
 *
 * @example
 * ```ts
 * notionFile.upload('upload-id')
 * ```
 */
function uploadFile(id: string): FileUploadRef {
  return { type: 'file_upload', file_upload: { id } };
}

/**
 * Helpers for constructing general Notion file objects.
 *
 * Useful for file blocks, image blocks, audio blocks, video blocks,
 * and file property entries.
 *
 * @example
 * ```ts
 * import { notionFile } from '@visus-io/notion-sdk-ts';
 *
 * notionFile.external('https://example.com/doc.pdf')
 * notionFile.upload('upload-id')
 * ```
 */
export const notionFile = {
  external: externalFile,
  upload: uploadFile,
};
