import { describe, expect, it } from 'vitest';
import { cover, icon, notionFile } from './file.helpers';

describe('icon helpers', () => {
  it('should create an emoji icon', () => {
    expect(icon.emoji('🚀')).toEqual({ type: 'emoji', emoji: '🚀' });
  });

  it('should create an external icon', () => {
    expect(icon.external('https://example.com/icon.png')).toEqual({
      type: 'external',
      external: { url: 'https://example.com/icon.png' },
    });
  });

  it('should create a file upload icon', () => {
    expect(icon.fileUpload('upload-123')).toEqual({
      type: 'file_upload',
      file_upload: { id: 'upload-123' },
    });
  });
});

describe('cover helpers', () => {
  it('should create an external cover', () => {
    expect(cover.external('https://example.com/banner.jpg')).toEqual({
      type: 'external',
      external: { url: 'https://example.com/banner.jpg' },
    });
  });

  it('should create a file upload cover', () => {
    expect(cover.fileUpload('upload-456')).toEqual({
      type: 'file_upload',
      file_upload: { id: 'upload-456' },
    });
  });
});

describe('notionFile helpers', () => {
  it('should create an external file', () => {
    expect(notionFile.external('https://example.com/doc.pdf')).toEqual({
      type: 'external',
      external: { url: 'https://example.com/doc.pdf' },
    });
  });

  it('should create a file upload reference', () => {
    expect(notionFile.upload('upload-789')).toEqual({
      type: 'file_upload',
      file_upload: { id: 'upload-789' },
    });
  });
});
