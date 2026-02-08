/** All color options supported by Notion. */
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

export type NotionColor = (typeof NOTION_COLORS)[number];
