import { NotionClient, type NotionClientOptions } from './client';
import {
  AsyncTasksAPI,
  BlocksAPI,
  CommentsAPI,
  CustomEmojisAPI,
  DatabasesAPI,
  DataSourcesAPI,
  FileUploadsAPI,
  PagesAPI,
  SearchAPI,
  UsersAPI,
  ViewsAPI,
} from './api';

/**
 * The public entry point for the SDK.
 *
 * Create one `Notion` instance, then call its API properties, such as
 * `pages` or `blocks`, to reach Notion endpoints.
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
 *
 * const views = await notion.views.list({ data_source_id: 'data-source-id' });
 * const queryResult = await notion.views.queries.create(views.results[0].id);
 *
 * const markdown = await notion.pages.getMarkdown('page-id');
 * const task = await notion.pages.updateMarkdown('page-id', {
 *   type: 'replace_content',
 *   new_str: 'Updated content',
 *   allow_async: true,
 * });
 * await notion.asyncTasks.poll(task.id);
 *
 * const emojis = await notion.customEmojis.list();
 * ```
 *
 * @category Client & Core
 */
export class Notion {
  private readonly client: NotionClient;

  /** Async Tasks API for polling long-running Notion operations */
  public readonly asyncTasks: AsyncTasksAPI;

  /** Blocks API for working with Notion blocks */
  public readonly blocks: BlocksAPI;

  /** Comments API for working with Notion comments */
  public readonly comments: CommentsAPI;

  /** Custom Emojis API for listing workspace custom emojis */
  public readonly customEmojis: CustomEmojisAPI;

  /** Databases API for working with Notion databases */
  public readonly databases: DatabasesAPI;

  /** Data Sources API for working with Notion data sources */
  public readonly dataSources: DataSourcesAPI;

  /** FileUploads API for uploading files to Notion */
  public readonly fileUploads: FileUploadsAPI;

  /** Pages API for working with Notion pages */
  public readonly pages: PagesAPI;

  /** Search API for searching across the workspace */
  public readonly search: SearchAPI;

  /** Users API for working with Notion users */
  public readonly users: UsersAPI;

  /** Views API for working with Notion database/data source views */
  public readonly views: ViewsAPI;

  constructor(options: NotionClientOptions) {
    this.client = new NotionClient(options);
    this.asyncTasks = new AsyncTasksAPI(this.client);
    this.blocks = new BlocksAPI(this.client);
    this.comments = new CommentsAPI(this.client);
    this.customEmojis = new CustomEmojisAPI(this.client);
    this.databases = new DatabasesAPI(this.client);
    this.dataSources = new DataSourcesAPI(this.client);
    this.fileUploads = new FileUploadsAPI(this.client);
    this.pages = new PagesAPI(this.client);
    this.search = new SearchAPI(this.client);
    this.users = new UsersAPI(this.client);
    this.views = new ViewsAPI(this.client);
  }
}
