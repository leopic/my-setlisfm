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
