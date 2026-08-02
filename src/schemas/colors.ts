/** All color options supported by Notion.
 *
 * @category Shared Types
 */
export const NOTION_COLORS = [
  'blue',
  'blue_background',
  'brown',
  'brown_background',
  'default',
  'gray',
  'gray_background',
  'green',
  'green_background',
  'orange',
  'orange_background',
  'pink',
  'pink_background',
  'purple',
  'purple_background',
  'red',
  'red_background',
  'yellow',
  'yellow_background',
] as const;

/**
 * @category Shared Types
 */
export type NotionColor = (typeof NOTION_COLORS)[number];
