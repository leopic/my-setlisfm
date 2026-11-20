import type { ViewStyle } from 'react-native';

// Corner radii: 8 for small controls, 12 for cards and fields, 16 for sheets. Round shapes
// (pills, dots, bars, avatars) use `full`; React Native caps it at half the shorter side.
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

// Spread one into a style: the radius with Apple's smooth corner curve.
export const Corner = {
  sm: { borderRadius: Radius.sm, borderCurve: 'continuous' },
  md: { borderRadius: Radius.md, borderCurve: 'continuous' },
  lg: { borderRadius: Radius.lg, borderCurve: 'continuous' },
} as const satisfies Record<string, ViewStyle>;
