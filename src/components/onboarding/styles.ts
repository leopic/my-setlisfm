import { StyleSheet } from 'react-native';
import type { ChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

// Spine geometry constants
const SPINE_MARGIN_LEFT = 24;
export const SPINE_PADDING_LEFT = 28;

// Built once per screen render and passed down, so rows share one StyleSheet.
export function createOnboardingStyles(colors: ChronicleColors) {
  return StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 28,
      paddingBottom: 8,
      alignItems: 'center',
    },
    wordmark: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 4,
    },

    // ── Spine area ───────────────────────────────────────────────────
    spineArea: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 36,
    },
    spineTrack: {
      borderLeftWidth: 1.5,
      borderLeftColor: colors.spineColor,
      marginLeft: SPINE_MARGIN_LEFT,
      paddingLeft: SPINE_PADDING_LEFT,
    },

    // ── Step entry ───────────────────────────────────────────────────
    stepEntry: {
      paddingTop: 2,
      paddingBottom: 40,
      position: 'relative',
    },
    stepEntryLast: {
      paddingBottom: 8,
    },

    // Dot (base — position/size set inline)
    dotBase: {
      position: 'absolute',
      top: 6,
    },

    // Glow halo behind active dot (size/position set inline)
    glowHalo: {
      position: 'absolute',
      borderRadius: 25,
      backgroundColor: colors.accent,
    },

    // Step text
    stepTitle: {
      ...Type.headline,
      color: colors.textPrimary,
      marginBottom: 3,
    },
    stepTitleWaiting: {
      fontFamily: Type.body.fontFamily,
      color: colors.textDisabled,
    },
    stepTitleDone: {
      color: colors.textMuted,
    },
    stepTitleError: {
      color: colors.danger,
    },
    stepDetail: {
      ...Type.subheadline,
      color: colors.textSecondary,
      marginTop: 1,
    },
    stepDetailWaiting: {
      color: colors.textDisabled,
    },

    // Progress bar
    progressBar: {
      width: '100%',
      height: 2,
      backgroundColor: colors.border,
      borderRadius: 1,
      overflow: 'hidden',
      marginTop: 10,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 1,
    },

    // Quip — fixed-height container prevents layout shift between
    // 0, 1, and 2-line quips. Height = 2 lines × lineHeight 20 + buffer.
    quipContainer: {
      marginTop: 12,
      height: 44,
      overflow: 'hidden',
      justifyContent: 'flex-start',
    },
    quipText: {
      ...Type.subheadline,
      color: colors.textMuted,
      fontStyle: 'italic',
    },

    // ── Bottom section ───────────────────────────────────────────────
    bottom: {
      paddingHorizontal: 36,
      paddingBottom: 36,
      paddingTop: 8,
    },
    input: {
      ...Type.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 14,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.35 },
    buttonText: {
      ...Type.headline,
      color: colors.textOnAccent,
    },
    errorButton: {
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    errorButtonText: {
      ...Type.headline,
      color: colors.danger,
    },
  });
}

export type OnboardingStyles = ReturnType<typeof createOnboardingStyles>;
