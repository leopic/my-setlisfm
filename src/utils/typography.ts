import type { TextStyle } from 'react-native';

export const FontFamily = {
  light: 'SpaceGrotesk_300Light',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

export const Type = {
  // App name, year-ghost chapter headings
  display: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    letterSpacing: -0.8,
    lineHeight: 28,
  } satisfies TextStyle,

  // Page titles ("Artists"), artist name on concert detail
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 24,
  } satisfies TextStyle,

  // Artist names in the river, city names in venues
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 20,
  } satisfies TextStyle,

  // Venue names, meta lines, song titles
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  } satisfies TextStyle,

  // Section caps (SET 1, HIGHLIGHTS), dates, tab labels, song numbers
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: 14,
  } satisfies TextStyle,

  // Show counts in the almanac, stat numbers
  count: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    lineHeight: 22,
  } satisfies TextStyle,
} as const;
