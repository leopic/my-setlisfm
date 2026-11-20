import { StyleSheet } from 'react-native';
import { Type } from '@/utils/typography';
import type { ChronicleColors } from '@/utils/colors';

// One StyleSheet for the whole stats screen, created once per parent render and passed down.
export function createStatsStyles(colors: ChronicleColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...Type.largeTitle, color: colors.textPrimary },
    headerSub: { ...Type.subheadline, color: colors.textSecondary, marginTop: 2 },
    scroll: { flex: 1 },
    content: { paddingBottom: 48 },
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 4,
    },
    sectionLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    chartTitle: {
      ...Type.footnote,
      color: colors.textMuted,
      marginBottom: 10,
      letterSpacing: 0.6,
    },
    cardRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    statValue: { ...Type.title2, color: colors.textPrimary },
    statLabel: { ...Type.subheadline, color: colors.textSecondary, marginTop: 3 },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 20,
      marginTop: 16,
    },
    mapCard: {
      marginHorizontal: 20,
      marginBottom: 10,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      height: 160,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapInner: { alignItems: 'center', gap: 6 },
    mapLabel: { ...Type.headline, color: colors.textSecondary },
    mapSub: { ...Type.subheadline, color: colors.textMuted },
    // ── Milestone list ────────────────────────────────────────────────
    milestoneRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    milestoneOrdinal: {
      ...Type.footnote,
      color: colors.accent,
      width: 44,
      textAlign: 'right',
      paddingTop: 1,
    },
    milestoneInfo: { flex: 1 },
    milestoneTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 8,
    },
    milestoneArtist: { ...Type.headline, color: colors.textPrimary, flex: 1 },
    milestoneDate: { ...Type.footnote, color: colors.accent },
    milestoneVenue: { ...Type.footnote, color: colors.textMuted, marginTop: 2 },
    // ── Tablet 2-column ───────────────────────────────────────────────
    twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
    twoColLeft: { flex: 1 },
    twoColRight: { flex: 1 },
    twoColDivider: { width: 1, backgroundColor: colors.border, alignSelf: 'stretch' },
  });
}

export type StatsStyles = ReturnType<typeof createStatsStyles>;
