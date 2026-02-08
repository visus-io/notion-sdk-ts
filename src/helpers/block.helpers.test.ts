import { describe, expect, it } from 'vitest';
import { block } from './block.helpers';
import { richText } from './richText.helpers';

describe('block helpers', () => {
  // -----------------------------------------------------------------------
  // Text blocks
  // -----------------------------------------------------------------------

  describe('paragraph', () => {
    it('should create a paragraph from a string', () => {
      const result = block.paragraph('Hello');
      expect(result).toEqual({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Hello', link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              plain_text: 'Hello',
              href: null,
            },
          ],
          color: 'default',
        },
      });
    });

    it('should accept a RichTextBuilder', () => {
      const result = block.paragraph(richText('Bold').bold());
      const rt = (result.paragraph as { rich_text: unknown[] }).rich_text;
      expect(rt).toHaveLength(1);
      expect((rt[0] as { annotations: { bold: boolean } }).annotations.bold).toBe(true);
    });

    it('should accept a pre-built NotionRichText array', () => {
      const built = richText('Pre-built').italic().build();
      const result = block.paragraph(built);
      const rt = (result.paragraph as { rich_text: unknown[] }).rich_text;
      expect(rt).toEqual(built);
    });

    it('should accept color and children options', () => {
      const child = block.paragraph('child');
      const result = block.paragraph('Parent', { color: 'blue', children: [child] });
      const p = result.paragraph as { color: string; children: unknown[] };
      expect(p.color).toBe('blue');
      expect(p.children).toHaveLength(1);
    });
  });

  describe('headings', () => {
    it('should create heading_1', () => {
      const result = block.heading1('Title');
      expect(result.type).toBe('heading_1');
      const h = result.heading_1 as { is_toggleable: boolean; color: string };
      expect(h.is_toggleable).toBe(false);
      expect(h.color).toBe('default');
    });

    it('should create heading_2 with options', () => {
      const result = block.heading2('Subtitle', { color: 'red', isToggleable: true });
      const h = result.heading_2 as { is_toggleable: boolean; color: string };
      expect(h.is_toggleable).toBe(true);
      expect(h.color).toBe('red');
    });

    it('should create heading_3', () => {
      const result = block.heading3('Section');
      expect(result.type).toBe('heading_3');
    });
  });

  describe('list items', () => {
    it('should create a bulleted list item', () => {
      const result = block.bulletedListItem('Item');
      expect(result.type).toBe('bulleted_list_item');
    });

    it('should create a numbered list item with options', () => {
      const result = block.numberedListItem('Step', {
        listStartIndex: 5,
        listFormat: 'roman',
      });
      const n = result.numbered_list_item as {
        list_start_index: number;
        list_format: string;
      };
      expect(n.list_start_index).toBe(5);
      expect(n.list_format).toBe('roman');
    });
  });

  describe('toDo', () => {
    it('should create an unchecked to-do by default', () => {
      const result = block.toDo('Task');
      const td = result.to_do as { checked: boolean };
      expect(td.checked).toBe(false);
    });

    it('should create a checked to-do', () => {
      const result = block.toDo('Done', { checked: true });
      const td = result.to_do as { checked: boolean };
      expect(td.checked).toBe(true);
    });
  });

  describe('toggle', () => {
    it('should create a toggle block', () => {
      const result = block.toggle('Click me');
      expect(result.type).toBe('toggle');
    });

    it('should accept children', () => {
      const result = block.toggle('Parent', {
        children: [block.paragraph('Child')],
      });
      const t = result.toggle as { children: unknown[] };
      expect(t.children).toHaveLength(1);
    });
  });

  describe('quote', () => {
    it('should create a quote block', () => {
      const result = block.quote('Wise words');
      expect(result.type).toBe('quote');
    });
  });

  describe('callout', () => {
    it('should create a callout with default emoji', () => {
      const result = block.callout('Note');
      const c = result.callout as { icon: { type: string; emoji: string } };
      expect(c.icon).toEqual({ type: 'emoji', emoji: '💡' });
    });

    it('should accept a custom icon', () => {
      const result = block.callout('Warning', {
        icon: { type: 'emoji', emoji: '⚠️' },
      });
      const c = result.callout as { icon: { emoji: string } };
      expect(c.icon.emoji).toBe('⚠️');
    });
  });

  describe('template', () => {
    it('should create a template block', () => {
      const result = block.template('Template title');
      expect(result.type).toBe('template');
    });
  });

  // -----------------------------------------------------------------------
  // Code & equation
  // -----------------------------------------------------------------------

  describe('code', () => {
    it('should create a code block', () => {
      const result = block.code('const x = 1;', 'typescript');
      const c = result.code as { language: string; caption: unknown[] };
      expect(c.language).toBe('typescript');
      expect(c.caption).toEqual([]);
    });

    it('should accept a caption', () => {
      const result = block.code('print("hi")', 'python', { caption: 'A Python snippet' });
      const c = result.code as { caption: unknown[] };
      expect(c.caption).toHaveLength(1);
    });
  });

  describe('equation', () => {
    it('should create an equation block', () => {
      const result = block.equation('E=mc^2');
      expect(result).toEqual({
        object: 'block',
        type: 'equation',
        equation: { expression: 'E=mc^2' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Media blocks
  // -----------------------------------------------------------------------

  describe('image', () => {
    it('should create an image block from a URL string', () => {
      const result = block.image('https://example.com/img.png');
      expect(result.type).toBe('image');
      const img = result.image as { type: string; external: { url: string } };
      expect(img.type).toBe('external');
      expect(img.external.url).toBe('https://example.com/img.png');
    });

    it('should accept a file upload source', () => {
      const result = block.image({ type: 'file_upload', file_upload: { id: 'upload-123' } });
      const img = result.image as { type: string; file_upload: { id: string } };
      expect(img.type).toBe('file_upload');
      expect(img.file_upload.id).toBe('upload-123');
    });

    it('should accept a caption', () => {
      const result = block.image('https://example.com/img.png', { caption: 'A photo' });
      const img = result.image as { caption: unknown[] };
      expect(img.caption).toHaveLength(1);
    });
  });

  describe('video', () => {
    it('should create a video block', () => {
      const result = block.video('https://example.com/vid.mp4');
      expect(result.type).toBe('video');
    });
  });

  describe('audio', () => {
    it('should create an audio block', () => {
      const result = block.audio('https://example.com/sound.mp3');
      expect(result.type).toBe('audio');
    });
  });

  describe('file', () => {
    it('should create a file block', () => {
      const result = block.file('https://example.com/doc.pdf');
      expect(result.type).toBe('file');
    });
  });

  describe('pdf', () => {
    it('should create a PDF block', () => {
      const result = block.pdf('https://example.com/doc.pdf');
      expect(result.type).toBe('pdf');
    });
  });

  // -----------------------------------------------------------------------
  // Embed blocks
  // -----------------------------------------------------------------------

  describe('embed', () => {
    it('should create an embed block', () => {
      const result = block.embed('https://youtube.com/watch?v=123');
      expect(result).toEqual({
        object: 'block',
        type: 'embed',
        embed: { url: 'https://youtube.com/watch?v=123' },
      });
    });
  });

  describe('bookmark', () => {
    it('should create a bookmark block', () => {
      const result = block.bookmark('https://example.com');
      const bm = result.bookmark as { url: string; caption: unknown[] };
      expect(bm.url).toBe('https://example.com');
      expect(bm.caption).toEqual([]);
    });

    it('should accept a caption', () => {
      const result = block.bookmark('https://example.com', { caption: 'Example site' });
      const bm = result.bookmark as { caption: unknown[] };
      expect(bm.caption).toHaveLength(1);
    });
  });

  describe('linkPreview', () => {
    it('should create a link preview block', () => {
      const result = block.linkPreview('https://example.com');
      expect(result).toEqual({
        object: 'block',
        type: 'link_preview',
        link_preview: { url: 'https://example.com' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Structural blocks
  // -----------------------------------------------------------------------

  describe('divider', () => {
    it('should create a divider block', () => {
      expect(block.divider()).toEqual({
        object: 'block',
        type: 'divider',
        divider: {},
      });
    });
  });

  describe('breadcrumb', () => {
    it('should create a breadcrumb block', () => {
      expect(block.breadcrumb()).toEqual({
        object: 'block',
        type: 'breadcrumb',
        breadcrumb: {},
      });
    });
  });

  describe('tableOfContents', () => {
    it('should create a table of contents block', () => {
      const result = block.tableOfContents();
      expect(result.type).toBe('table_of_contents');
      const toc = result.table_of_contents as { color: string };
      expect(toc.color).toBe('default');
    });

    it('should accept a color option', () => {
      const result = block.tableOfContents({ color: 'gray' });
      const toc = result.table_of_contents as { color: string };
      expect(toc.color).toBe('gray');
    });
  });

  describe('table and tableRow', () => {
    it('should create a table block', () => {
      const result = block.table(3, { hasColumnHeader: true });
      const t = result.table as {
        table_width: number;
        has_column_header: boolean;
        has_row_header: boolean;
      };
      expect(t.table_width).toBe(3);
      expect(t.has_column_header).toBe(true);
      expect(t.has_row_header).toBe(false);
    });

    it('should create a table row with string cells', () => {
      const result = block.tableRow(['A', 'B', 'C']);
      const tr = result.table_row as { cells: unknown[][] };
      expect(tr.cells).toHaveLength(3);
    });

    it('should create a full table with children', () => {
      const result = block.table(2, {
        hasColumnHeader: true,
        children: [block.tableRow(['Name', 'Value']), block.tableRow(['Alpha', '1'])],
      });
      const t = result.table as { children: unknown[] };
      expect(t.children).toHaveLength(2);
    });
  });

  describe('columnList and column', () => {
    it('should create a column list wrapping columns', () => {
      const result = block.columnList([[block.paragraph('Col 1')], [block.paragraph('Col 2')]]);
      expect(result.type).toBe('column_list');
      const cl = result.column_list as { children: { type: string }[] };
      expect(cl.children).toHaveLength(2);
      expect(cl.children[0].type).toBe('column');
      expect(cl.children[1].type).toBe('column');
    });

    it('should create a standalone column', () => {
      const result = block.column([block.paragraph('Content')]);
      expect(result.type).toBe('column');
    });
  });

  // -----------------------------------------------------------------------
  // Synced blocks
  // -----------------------------------------------------------------------

  describe('syncedBlock', () => {
    it('should create an original synced block', () => {
      const result = block.syncedBlock({
        children: [block.paragraph('Shared content')],
      });
      const sb = result.synced_block as { synced_from: null; children: unknown[] };
      expect(sb.synced_from).toBeNull();
      expect(sb.children).toHaveLength(1);
    });

    it('should create a reference to an existing synced block', () => {
      const result = block.syncedBlock({ syncedFrom: 'block-123' });
      const sb = result.synced_block as {
        synced_from: { type: string; block_id: string };
      };
      expect(sb.synced_from).toEqual({ type: 'block_id', block_id: 'block-123' });
    });

    it('should create a synced block with no options', () => {
      const result = block.syncedBlock();
      const sb = result.synced_block as { synced_from: null };
      expect(sb.synced_from).toBeNull();
    });
  });
});
