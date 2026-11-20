import { StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

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
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
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
    controls: {
      backgroundColor: colors.background,
      paddingTop: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: 20,
      marginBottom: 8,
    },
    searchInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      padding: 0,
    },
    sortStrip: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    sortPill: {
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 5,
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
      paddingVertical: 12,
      paddingRight: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    artistRowAccent: {
      borderLeftWidth: 2.5,
      borderLeftColor: colors.accent,
      paddingLeft: 13.5,
    },
    artistRowNoAccent: {
      paddingLeft: 16,
    },
    artistImageWrapper: {
      marginRight: 12,
    },
    artistCenter: {
      flex: 1,
      paddingRight: 12,
    },
    artistName: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    lastSeenText: {
      ...Type.subheadline,
      color: colors.textSecondary,
      marginTop: 2,
    },
    venuesText: {
      ...Type.subheadline,
      color: colors.textMuted,
      marginTop: 1,
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
      marginLeft: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
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
      paddingVertical: 12,
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
    artistRowSelected: { backgroundColor: colors.accentSoft },
  });
}

export type ArtistsStyles = ReturnType<typeof useArtistsStyles>;
