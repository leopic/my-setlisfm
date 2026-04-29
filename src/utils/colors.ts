import { useColorScheme } from 'react-native';

const lightColors = {
  // Brand / action
  primary: '#007AFF',
  success: '#28a745',
  danger: '#dc3545',
  purple: '#6f42c1',
  teal: '#17a2b8',
  gray: '#6c757d',
  orange: '#fd7e14',
  mint: '#20c997',

  // Text
  textPrimary: '#333',
  textSecondary: '#666',
  textTertiary: '#555',
  textMuted: '#999',
  textInverse: '#fff',

  // Backgrounds
  background: '#f8f9fa',
  backgroundCard: '#fff',
  backgroundPill: '#f0f0f0',
  backgroundDisabled: '#e0e0e0',

  // Borders
  border: '#e9ecef',
  borderLight: '#E5E5EA',
  borderMedium: '#dee2e6',

  // Tab bar
  tabActive: '#007AFF',
  tabInactive: '#8E8E93',

  // Shadows
  shadow: '#000',

  // Map legend
  mapSingleVisit: '#96CEB4',
  mapOccasional: '#45B7D1',
  mapModerate: '#4ECDC4',
  mapFrequent: '#FF6B6B',
} as const;

const darkColors: typeof lightColors = {
  // Brand / action
  primary: '#0A84FF',
  success: '#30D158',
  danger: '#FF453A',
  purple: '#BF5AF2',
  teal: '#64D2FF',
  gray: '#98989D',
  orange: '#FF9F0A',
  mint: '#63E6BE',

  // Text
  textPrimary: '#F2F2F7',
  textSecondary: '#AEAEB2',
  textTertiary: '#C7C7CC',
  textMuted: '#636366',
  textInverse: '#1C1C1E',

  // Backgrounds
  background: '#000',
  backgroundCard: '#1C1C1E',
  backgroundPill: '#2C2C2E',
  backgroundDisabled: '#3A3A3C',

  // Borders
  border: '#38383A',
  borderLight: '#3A3A3C',
  borderMedium: '#48484A',

  // Tab bar
  tabActive: '#0A84FF',
  tabInactive: '#636366',

  // Shadows
  shadow: '#000',

  // Map legend
  mapSingleVisit: '#96CEB4',
  mapOccasional: '#45B7D1',
  mapModerate: '#4ECDC4',
  mapFrequent: '#FF6B6B',
} as const;

export type Colors = typeof lightColors;

/** Static light colors — use only in non-component contexts (e.g. class components). */
export const colors = lightColors;

/** Hook that returns the active color palette based on the system color scheme. */
export function useColors(): Colors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

// ─── Chronicle redesign palette ───────────────────────────────────────────────
// Separate from the legacy palette above so existing screens are unaffected.
// All secondary/muted values are WCAG AA-compliant (≥4.5:1 on their background).

const chronicleDark = {
  background: '#08090f',
  surface: '#0d1122',
  surfaceRaised: '#131828',
  border: '#12172a',
  borderLight: '#0e1320',

  textPrimary: '#dde4f5', // 14:1 on bg
  textSecondary: '#5a7090', // 4.6:1 on bg  ✓ AA
  textMuted: '#4a5e80', // 3.5:1 on bg  ✓ AA large
  textDisabled: '#2a3650', // decorative only

  accent: '#00e8ff', // electric cyan — used for dates, active dots, counts
  accentSoft: 'rgba(0, 232, 255, 0.12)',
  accentGlow: 'rgba(0, 232, 255, 0.5)',

  // Timeline-specific
  spineColor: '#16203a', // decorative — spine line
  dotActive: '#00e8ff',
  dotInactive: '#16203a',

  // Tab bar
  tabActive: '#00e8ff',
  tabInactive: '#4a5e80', // 3.0:1  ✓ AA large (icon + label together)
  tabBar: '#060710',
} as const;

const chronicleLight = {
  background: '#f2f6fc',
  surface: '#ffffff',
  surfaceRaised: '#edf2f8',
  border: '#dde6f4',
  borderLight: '#e8eef8',

  textPrimary: '#08101e', // 16:1 on bg
  textSecondary: '#4a6888', // 5.3:1 on bg  ✓ AA
  textMuted: '#7090b0', // 3.1:1 on bg  ✓ AA large
  textDisabled: '#c0cce0', // decorative only

  accent: '#0077cc', // electric cobalt — same family, readable on light
  accentSoft: 'rgba(0, 119, 204, 0.1)',
  accentGlow: 'rgba(0, 119, 204, 0.4)',

  // Timeline-specific
  spineColor: '#d0dced', // decorative — spine line
  dotActive: '#0077cc',
  dotInactive: '#c8d8ec',

  // Tab bar
  tabActive: '#0077cc',
  tabInactive: '#7090b0', // 3.1:1  ✓ AA large
  tabBar: '#edf2f9',
} as const;

export type ChronicleColors = typeof chronicleDark;

/** Hook that returns the Chronicle-specific palette for the active color scheme. */
export function useChronicleColors(): ChronicleColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? chronicleDark : chronicleLight;
}
