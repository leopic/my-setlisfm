import { StyleSheet } from 'react-native';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import type { ChronicleColors } from '@/utils/colors';

// One StyleSheet for the whole venues screen, created once per parent render and passed down.
export function createVenueStyles(colors: ChronicleColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Header ───────────────────────────────────────────────────────
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
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
      marginTop: 2,
    },

    // ── Geo navigation strip ─────────────────────────────────────────
    geoStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    geoButton: {
      paddingHorizontal: 14,
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    geoButtonLabel: {
      ...Type.footnote,
      color: colors.accent,
    },

    // ── Controls (pinned above list) ─────────────────────────────────
    controls: {
      backgroundColor: colors.background,
      paddingTop: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
    },
    searchInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      padding: 0,
    },
    sortRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    sortPill: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      borderRadius: TOUCH_TARGET / 2,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    sortPillActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    sortPillText: {
      ...Type.footnote,
      color: colors.textMuted,
    },
    sortPillTextActive: {
      color: colors.accent,
    },

    // ── Venue rows ───────────────────────────────────────────────────
    venueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    venueLeft: {
      flex: 1,
      marginRight: 12,
    },
    venueName: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    venueLocation: {
      ...Type.subheadline,
      color: colors.textSecondary,
      marginTop: 1,
    },
    venueLastShow: {
      ...Type.subheadline,
      color: colors.textMuted,
      marginTop: 2,
    },
    venueArtists: {
      ...Type.subheadline,
      color: colors.textMuted,
      marginTop: 2,
    },
    venueRight: {
      alignItems: 'center',
      minWidth: 44,
    },
    visitCount: {
      ...Type.title3,
      color: colors.accent,
    },
    visitLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      marginTop: 1,
    },

    // ── Empty state ──────────────────────────────────────────────────
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      ...Type.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    refreshButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    refreshButtonText: {
      ...Type.footnote,
      color: colors.textOnAccent,
    },
    // ── Tablet master-detail ─────────────────────────────────────────
    masterDetail: { flex: 1, flexDirection: 'row' },
    sidebar: { borderRightWidth: 1, borderRightColor: colors.border },
    detailPane: { flex: 1 },
    venueRowSelected: { backgroundColor: colors.accentSoft },
  });
}

export type VenueStyles = ReturnType<typeof createVenueStyles>;
