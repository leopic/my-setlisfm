import type { TextStyle } from 'react-native';

const FontFamily = {
  light: 'SpaceGrotesk_300Light',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

// Apple's text styles at the default text size, set in Space Grotesk.
// Use these for every text; no direct font sizes in components.
export const Type = {
  // App name, page titles ("Artists")
  largeTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 41,
  } satisfies TextStyle,

  // Titles of pushed screens and detail panes (artist name on a setlist)
  title1: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 34,
  } satisfies TextStyle,

  // Big values in cards ("Friday", "2024")
  title2: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 28,
  } satisfies TextStyle,

  // Numbers in rows (show counts, visit counts)
  title3: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 25,
  } satisfies TextStyle,

  // Row titles (artist, venue and city names), button text
  headline: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
    lineHeight: 22,
  } satisfies TextStyle,

  // Main text: song titles, settings rows, inputs, back buttons
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 17,
    letterSpacing: 0,
    lineHeight: 22,
  } satisfies TextStyle,

  // Second lines under a title: meta lines, subtitles, venue and city
  subheadline: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 20,
  } satisfies TextStyle,

  // Section caps (SET 1, HIGHLIGHTS), dates, pills, song numbers
  footnote: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    lineHeight: 18,
  } satisfies TextStyle,

  // Small text in charts, compact cards and legends
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 16,
  } satisfies TextStyle,

  // Small labels: caps, month letters, chart titles
  captionStrong: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.3,
    lineHeight: 16,
  } satisfies TextStyle,

  // The big faded year numbers that start each year
  yearGhost: {
    fontFamily: FontFamily.bold,
    fontSize: 56,
    letterSpacing: -2,
    lineHeight: 56,
  } satisfies TextStyle,
} as const;
