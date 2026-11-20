// One spacing scale on a 4 pt grid, built from the values the app used most. Use these for
// every padding, margin and gap; a value between two steps takes the nearer one.
export const Space = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s48: 48,
  s64: 64,
  // Left and right margin of every screen, header, row and section.
  edge: 20,
} as const;

// Room under scrolling content so its end clears the floating native tab bar.
export const TAB_BAR_PADDING = 100;
