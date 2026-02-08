import { describe, expect, it } from 'vitest';
import { RichText } from '.';

describe('RichText', () => {
  it('should convert to plain text', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'Hello ', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Hello ',
        href: null,
      },
      {
        type: 'text',
        text: { content: 'World', link: null },
        annotations: {
          bold: true,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'World',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toPlainText()).toBe('Hello World');
  });

  it('should convert to markdown', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'Bold text', link: null },
        annotations: {
          bold: true,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Bold text',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toMarkdown()).toBe('**Bold text**');
  });

  it('should convert all markdown formats', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'code', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: true,
          color: 'default',
        },
        plain_text: 'code',
        href: null,
      },
      {
        type: 'text',
        text: { content: ' italic', link: null },
        annotations: {
          bold: false,
          italic: true,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: ' italic',
        href: null,
      },
      {
        type: 'text',
        text: { content: ' strike', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: true,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: ' strike',
        href: null,
      },
      {
        type: 'text',
        text: { content: ' link', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: ' link',
        href: 'https://example.com',
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toMarkdown()).toBe('`code`* italic*~~ strike~~[ link](https://example.com)');
  });

  it('should detect and extract links', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'Click here', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Click here',
        href: 'https://example.com',
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.hasLinks()).toBe(true);
    expect(richText.getLinks()).toEqual(['https://example.com']);
  });

  it('should convert to HTML', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'Bold & Italic', link: null },
        annotations: {
          bold: true,
          italic: true,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Bold & Italic',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toHTML()).toBe('<em><strong>Bold &amp; Italic</strong></em>');
  });

  it('should handle complex HTML formatting', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'Code', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: true,
          color: 'default',
        },
        plain_text: 'Code',
        href: null,
      },
      {
        type: 'text',
        text: { content: ' text ', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: true,
          code: false,
          color: 'default',
        },
        plain_text: ' text ',
        href: null,
      },
      {
        type: 'text',
        text: { content: 'strikethrough', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: true,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'strikethrough',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toHTML()).toBe('<code>Code</code><u> text </u><s>strikethrough</s>');
  });

  it('should handle links in HTML', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'Visit site', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Visit site',
        href: 'https://example.com',
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toHTML()).toBe('<a href="https://example.com">Visit site</a>');
  });

  it('should handle empty links', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'No links', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'No links',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.hasLinks()).toBe(false);
    expect(richText.getLinks()).toEqual([]);
  });

  it('should serialize to JSON', () => {
    const richTextData = [
      {
        type: 'text',
        text: { content: 'Test', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Test',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    const json = richText.toJSON();
    expect(json).toEqual(richTextData);
  });

  it('should handle equation type in markdown', () => {
    const richTextData = [
      {
        type: 'equation',
        equation: { expression: 'E=mc^2' },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'E=mc^2',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toMarkdown()).toBe('$E=mc^2$');
  });

  it('should handle equation type in HTML', () => {
    const richTextData = [
      {
        type: 'equation',
        equation: { expression: 'x^2 + y^2 = z^2' },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'x^2 + y^2 = z^2',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.toHTML()).toBe('<span class="equation">x^2 + y^2 = z^2</span>');
  });

  it('should handle text.link in getLinks', () => {
    const richTextData = [
      {
        type: 'text',
        text: {
          content: 'Link text',
          link: { url: 'https://example.com/link' },
        },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Link text',
        href: null,
      },
    ];

    const richText = new RichText(richTextData);
    expect(richText.hasLinks()).toBe(true);
    expect(richText.getLinks()).toEqual(['https://example.com/link']);
  });
});
