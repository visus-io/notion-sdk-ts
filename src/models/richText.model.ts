import { type NotionRichText, richTextSchema } from '../schemas';

/**
 * RichText helper class for working with Notion rich text arrays.
 */
export class RichText {
  private readonly data: NotionRichText;

  constructor(data: unknown) {
    this.data = richTextSchema.parse(data);
  }

  /**
   * Get the plain text content without formatting.
   */
  toPlainText(): string {
    return this.data.map((segment) => segment.plain_text).join('');
  }

  /**
   * Get the markdown representation of the rich text.
   */
  toMarkdown(): string {
    return this.data
      .map((segment) => {
        let text = segment.plain_text;
        const ann = segment.annotations;

        // Handle different types
        if (segment.type === 'equation') {
          return `$${segment.equation.expression}$`;
        }

        if (ann.code) return `\`${text}\``;
        if (ann.bold) text = `**${text}**`;
        if (ann.italic) text = `*${text}*`;
        if (ann.strikethrough) text = `~~${text}~~`;
        if (segment.href) text = `[${text}](${segment.href})`;

        return text;
      })
      .join('');
  }

  /**
   * Get the HTML representation of the rich text.
   */
  toHTML(): string {
    return this.data
      .map((segment) => {
        let text = this.escapeHTML(segment.plain_text);
        const ann = segment.annotations;

        // Handle different types
        if (segment.type === 'equation') {
          return `<span class="equation">${this.escapeHTML(segment.equation.expression)}</span>`;
        }

        if (ann.code) text = `<code>${text}</code>`;
        if (ann.bold) text = `<strong>${text}</strong>`;
        if (ann.italic) text = `<em>${text}</em>`;
        if (ann.strikethrough) text = `<s>${text}</s>`;
        if (ann.underline) text = `<u>${text}</u>`;
        if (segment.href) text = `<a href="${this.escapeHTML(segment.href)}">${text}</a>`;

        return text;
      })
      .join('');
  }

  /**
   * Check if the rich text contains any links.
   */
  hasLinks(): boolean {
    return this.data.some((segment) => {
      if (segment.href) return true;
      if (segment.type === 'text' && segment.text.link) return true;
      return false;
    });
  }

  /**
   * Get all links from the rich text.
   */
  getLinks(): string[] {
    const links: string[] = [];
    for (const segment of this.data) {
      if (segment.href) links.push(segment.href);
      if (segment.type === 'text' && segment.text.link) {
        links.push(segment.text.link.url);
      }
    }
    return links;
  }

  /**
   * Get the raw validated data.
   */
  toJSON(): NotionRichText {
    return structuredClone(this.data);
  }

  private escapeHTML(text: string): string {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
