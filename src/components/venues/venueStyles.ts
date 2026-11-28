import { StyleSheet } from 'react-native';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import type { ChronicleColors } from '@/utils/colors';
import { Space } from '@/utils/spacing';
import { Corner, Radius } from '@/utils/radius';

// One StyleSheet for the whole venues screen, created once per parent render and passed down.
export function createVenueStyles(colors: ChronicleColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Header ───────────────────────────────────────────────────────
    header: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s12,
      paddingBottom: Space.s12,
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
    // Under the native large title: the title's own inset, a little air before the first row
    // (on an iPhone no controls sit between them).
    largeTitleSubtitle: { paddingHorizontal: Space.edge, paddingBottom: Space.s8 },

    // ── Geo navigation strip ─────────────────────────────────────────
    geoStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Space.s8,
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s12,
    },
    geoButton: {
      paddingHorizontal: Space.s16,
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      ...Corner.sm,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    geoButtonLabel: {
      ...Type.footnote,
      color: colors.accent,
    },

    // ── Controls (above the list; on a phone, at its top under the large title) ──
    controls: {
      backgroundColor: colors.background,
      paddingTop: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Space.edge,
      marginBottom: Space.s8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...Corner.md,
    },
    searchInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      padding: 0,
    },
    sortRow: {
      flexDirection: 'row',
      gap: Space.s8,
      paddingHorizontal: Space.edge,
      paddingBottom: Space.s12,
    },
    sortPill: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      borderRadius: Radius.full,
      paddingHorizontal: Space.s16,
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
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    venueLeft: {
      flex: 1,
      marginRight: Space.s12,
    },
    venueName: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    venueLocation: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    venueLastShow: {
      ...Type.subheadline,
      color: colors.textMuted,
    },
    venueArtists: {
      ...Type.subheadline,
      color: colors.textMuted,
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
    },

    // ── Empty state ──────────────────────────────────────────────────
    emptyState: {
      alignItems: 'center',
      paddingVertical: Space.s64,
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
    venueRowSelected: { backgroundColor: colors.accentSoft },
  });
}

export type VenueStyles = ReturnType<typeof createVenueStyles>;
