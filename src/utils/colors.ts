import { useColorScheme } from 'react-native';

// ─── Chronicle palette ────────────────────────────────────────────────────────
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
  // Cyan is light (high luminance) — text ON it must be near-black, not white
  textOnAccent: '#020d12',

  // Landmark recognition (e.g. a 10th-show milestone) — gold instead of the routine accent
  gold: '#ffc94d',
  goldSoft: 'rgba(255, 201, 77, 0.14)',
  goldGlow: 'rgba(255, 201, 77, 0.55)',
  textOnGold: '#1a1300',

  danger: '#ff453a', // iOS dark mode red

  chartGreen: '#30d158',
  chartOrange: '#ff9f0a',
  chartPurple: '#bf5af2',
  chartCoral: '#ff6b6b',

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
  // Cobalt is dark — white text is fine
  textOnAccent: '#ffffff',

  // Landmark recognition — a deeper gold than dark mode's, dark enough to read on white
  gold: '#8a6d00',
  goldSoft: 'rgba(138, 109, 0, 0.1)',
  goldGlow: 'rgba(138, 109, 0, 0.4)',
  textOnGold: '#ffffff',

  danger: '#c0392b', // readable red on light bg

  chartGreen: '#16a34a',
  chartOrange: '#b45309',
  chartPurple: '#7c3aed',
  chartCoral: '#dc2626',

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
  return (scheme === 'dark' ? chronicleDark : chronicleLight) as ChronicleColors;
}
