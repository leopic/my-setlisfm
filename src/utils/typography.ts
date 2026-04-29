import type { TextStyle } from 'react-native';

export const FontFamily = {
  light: 'SpaceGrotesk_300Light',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

// Reusable text style presets for Chronicle screens.
// All sizes are in logical pixels (React Native points).
// Avoid hardcoding fontFamily in StyleSheets — import from here instead.
export const Type = {
  // ── Display ────────────────────────────────────────────────────────────
  // App name, year-ghost chapter headings
  displayHero: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    letterSpacing: -1.2,
    lineHeight: 34,
  } satisfies TextStyle,

  displayLG: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    letterSpacing: -0.6,
    lineHeight: 26,
  } satisfies TextStyle,

  // ── Headlines ──────────────────────────────────────────────────────────
  headingXL: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 24,
  } satisfies TextStyle,

  headingLG: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    letterSpacing: -0.3,
    lineHeight: 22,
  } satisfies TextStyle,

  headingMD: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 20,
  } satisfies TextStyle,

  // ── Body ───────────────────────────────────────────────────────────────
  bodyLG: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,

  bodyMD: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  } satisfies TextStyle,

  bodySM: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
  } satisfies TextStyle,

  // ── Labels ─────────────────────────────────────────────────────────────
  // Small-caps section headers (HIGHLIGHTS, TIMELINE, etc.)
  labelCaps: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    lineHeight: 14,
  } satisfies TextStyle,

  labelSM: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.2,
    lineHeight: 15,
  } satisfies TextStyle,

  // Tab bar labels
  tabLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.1,
    lineHeight: 13,
  } satisfies TextStyle,

  // ── Stats / numbers ────────────────────────────────────────────────────
  // Hero stat (270 concerts)
  statHero: {
    fontFamily: FontFamily.bold,
    fontSize: 48,
    letterSpacing: -2.5,
    lineHeight: 48,
  } satisfies TextStyle,

  statXL: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    letterSpacing: -1.0,
    lineHeight: 30,
  } satisfies TextStyle,

  statLG: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    letterSpacing: -0.6,
    lineHeight: 24,
  } satisfies TextStyle,

  statMD: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    lineHeight: 20,
  } satisfies TextStyle,

  // Dates, song numbers, show counts — things that are fundamentally data
  dateMD: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.3,
    lineHeight: 16,
  } satisfies TextStyle,

  dateSM: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.4,
    lineHeight: 14,
  } satisfies TextStyle,
} as const;
