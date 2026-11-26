// Artist photo sizes: `inline` next to a line of text (timeline, highlights), `row` in a list
// row (44, the iOS minimum row height), `header` at the top of a screen or pane.
export const PhotoSize = {
  inline: 32,
  row: 44,
  header: 56,
} as const;

export type PhotoSizeName = keyof typeof PhotoSize;
