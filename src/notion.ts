import { NotionClient, type NotionClientOptions } from './client';
import {
  BlocksAPI,
  CommentsAPI,
  DatabasesAPI,
  DataSourcesAPI,
  FileUploadsAPI,
  PagesAPI,
  SearchAPI,
  UsersAPI,
} from './api';

/**
 * Main Notion SDK class.
 *
 * @example
 * ```typescript
 * import { Notion } from '@visus-io/notion-sdk-ts';
 *
 * const notion = new Notion({
 *   auth: process.env.NOTION_TOKEN
 * });
 *
 * const page = await notion.pages.retrieve('page-id');
 * console.log(page.getTitle());
 *
 * const block = await notion.blocks.retrieve('block-id');
 * const children = await notion.blocks.children.list('block-id');
 *
 * const database = await notion.databases.retrieve('database-id');
 * const pages = await notion.databases.query('database-id', { filter: {...} });
 *
 * const dataSource = await notion.dataSources.retrieve('data-source-id');
 * const pages = await notion.dataSources.query('data-source-id', { filter: {...} });
 *
 * const results = await notion.search.query({ query: 'meeting notes' });
 *
 * const user = await notion.users.retrieve('user-id');
 * const bot = await notion.users.me();
 *
 * const comments = await notion.comments.list('page-id');
 * await notion.comments.create({ parent: { page_id: 'page-id' }, rich_text: [...] });
 *
 * const fileUpload = await notion.fileUploads.uploadFile('image.png', buffer, 'image/png');
 * ```
 */
export class Notion {
  private readonly client: NotionClient;

  /** Pages API for working with Notion pages */
  public readonly pages: PagesAPI;

  /** Blocks API for working with Notion blocks */
  public readonly blocks: BlocksAPI;

  /** Databases API for working with Notion databases */
  public readonly databases: DatabasesAPI;

  /** Data Sources API for working with Notion data sources */
  public readonly dataSources: DataSourcesAPI;

  /** Search API for searching across the workspace */
  public readonly search: SearchAPI;

  /** Users API for working with Notion users */
  public readonly users: UsersAPI;

  /** Comments API for working with Notion comments */
  public readonly comments: CommentsAPI;

  /** FileUploads API for uploading files to Notion */
  public readonly fileUploads: FileUploadsAPI;

  constructor(options: NotionClientOptions) {
    this.client = new NotionClient(options);
    this.pages = new PagesAPI(this.client);
    this.blocks = new BlocksAPI(this.client);
    this.databases = new DatabasesAPI(this.client);
    this.dataSources = new DataSourcesAPI(this.client);
    this.search = new SearchAPI(this.client);
    this.users = new UsersAPI(this.client);
    this.comments = new CommentsAPI(this.client);
    this.fileUploads = new FileUploadsAPI(this.client);
  }
}
