import { StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import { Space } from '@/utils/spacing';
import { Corner, Radius } from '@/utils/radius';

const ACCENT_WIDTH = 2.5;

// One StyleSheet for the whole screen: the screen calls this once and passes the result
// down to its sections.
export function useArtistsStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s16,
      paddingBottom: Space.s16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...Type.largeTitle,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    controls: {
      backgroundColor: colors.background,
      paddingTop: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...Corner.md,
      marginHorizontal: Space.edge,
      marginBottom: Space.s8,
    },
    searchInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      padding: 0,
    },
    sortStrip: {
      flexDirection: 'row',
      gap: Space.s8,
      paddingHorizontal: Space.edge,
      paddingBottom: Space.s12,
    },
    sortPill: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      borderRadius: Radius.full,
      paddingHorizontal: Space.s12,
      borderWidth: 1,
    },
    sortPillActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    sortPillInactive: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    sortPillText: {
      ...Type.footnote,
    },
    sortPillTextActive: {
      color: colors.accent,
    },
    sortPillTextInactive: {
      color: colors.textMuted,
    },
    artistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Space.s12,
      paddingRight: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    // The blue bar takes part of the edge, so the photo lines up with the rows without it.
    artistRowAccent: {
      borderLeftWidth: ACCENT_WIDTH,
      borderLeftColor: colors.accent,
      paddingLeft: Space.edge - ACCENT_WIDTH,
    },
    artistRowNoAccent: {
      paddingLeft: Space.edge,
    },
    artistImageWrapper: {
      marginRight: Space.s12,
    },
    // A ring in the artist's photo color; clear until the color is known, so rows line up.
    artistImageRing: {
      borderWidth: 2,
      borderRadius: Radius.full,
      borderColor: 'transparent',
    },
    artistCenter: {
      flex: 1,
      paddingRight: Space.s12,
    },
    artistName: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    lastSeenText: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    venuesText: {
      ...Type.subheadline,
      color: colors.textMuted,
    },
    countText: {
      ...Type.title3,
    },
    countTextTop: {
      color: colors.accent,
    },
    countTextDefault: {
      color: colors.textMuted,
    },
    chevron: {
      ...Type.body,
      color: colors.textDisabled,
      marginLeft: Space.s8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Space.s64,
      paddingHorizontal: Space.edge,
    },
    emptyStateText: {
      ...Type.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Space.s20,
    },
    refreshButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: Space.s20,
      paddingVertical: Space.s12,
      borderRadius: Radius.full,
    },
    refreshButtonText: {
      ...Type.footnote,
      color: colors.textOnAccent,
    },
    // ── Tablet master-detail ─────────────────────────────────────────
    masterDetail: { flex: 1, flexDirection: 'row' },
    sidebar: { borderRightWidth: 1, borderRightColor: colors.border },
    detailPane: { flex: 1 },
    artistRowSelected: { backgroundColor: colors.accentSoft },
  });
}

export type ArtistsStyles = ReturnType<typeof useArtistsStyles>;
