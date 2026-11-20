import { StyleSheet } from 'react-native';
import type { ChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { Space } from '@/utils/spacing';

// Spine geometry constants
const SPINE_MARGIN_LEFT = Space.s24;
// Puts the 13 pt dot level with the step title's first line.
export const STEP_DOT_TOP = (Type.headline.lineHeight - 13) / 2;
export const SPINE_PADDING_LEFT = Space.s32;

// Built once per screen render and passed down, so rows share one StyleSheet.
export function createOnboardingStyles(colors: ChronicleColors) {
  return StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Space.s32,
      paddingBottom: Space.s8,
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
      paddingHorizontal: Space.s32,
    },
    spineTrack: {
      borderLeftWidth: 1.5,
      borderLeftColor: colors.spineColor,
      marginLeft: SPINE_MARGIN_LEFT,
      paddingLeft: SPINE_PADDING_LEFT,
    },

    // ── Step entry ───────────────────────────────────────────────────
    stepEntry: {
      paddingBottom: Space.s48,
      position: 'relative',
    },
    stepEntryLast: {
      paddingBottom: Space.s8,
    },

    // Dot (base — position/size set inline)
    dotBase: {
      position: 'absolute',
      top: STEP_DOT_TOP,
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
      marginTop: Space.s12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 1,
    },

    // Quip — fixed-height container prevents layout shift between
    // 0, 1, and 2-line quips. Height = 2 lines × lineHeight 20 + buffer.
    quipContainer: {
      marginTop: Space.s12,
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
      paddingHorizontal: Space.s32,
      paddingBottom: Space.s32,
      paddingTop: Space.s8,
    },
    input: {
      ...Type.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: Space.s16,
      paddingVertical: Space.s16,
      marginBottom: Space.s16,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: Space.s16,
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
      paddingVertical: Space.s16,
      alignItems: 'center',
    },
    errorButtonText: {
      ...Type.headline,
      color: colors.danger,
    },
  });
}

export type OnboardingStyles = ReturnType<typeof createOnboardingStyles>;
