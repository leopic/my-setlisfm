import { StyleSheet } from 'react-native';
import { Type } from '@/utils/typography';
import type { ChronicleColors } from '@/utils/colors';
import { Space } from '@/utils/spacing';
import { Corner } from '@/utils/radius';

// One StyleSheet for the whole stats screen, created once per parent render and passed down.
export function createStatsStyles(colors: ChronicleColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s16,
      paddingBottom: Space.s16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...Type.largeTitle, color: colors.textPrimary },
    headerSub: { ...Type.subheadline, color: colors.textSecondary },
    // Under the native large title: the title's own inset.
    largeTitleSubtitle: { paddingHorizontal: Space.edge },
    scroll: { flex: 1 },
    content: { paddingBottom: Space.s48 },
    section: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s20,
      paddingBottom: Space.s4,
    },
    sectionLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: Space.s12,
    },
    chartCard: {
      backgroundColor: colors.surface,
      ...Corner.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Space.s16,
      marginBottom: Space.s12,
    },
    chartTitle: {
      ...Type.footnote,
      color: colors.textMuted,
      marginBottom: Space.s12,
      letterSpacing: 0.6,
    },
    cardRow: { flexDirection: 'row', gap: Space.s12 },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      ...Corner.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Space.s16,
    },
    statValue: { ...Type.title2, color: colors.textPrimary },
    statLabel: { ...Type.subheadline, color: colors.textSecondary },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: Space.edge,
      marginTop: Space.s16,
    },
    mapCard: {
      marginHorizontal: Space.edge,
      marginBottom: Space.s12,
      backgroundColor: colors.surface,
      ...Corner.md,
      borderWidth: 1,
      borderColor: colors.border,
      height: 160,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapInner: { alignItems: 'center', gap: Space.s4 },
    mapLabel: { ...Type.headline, color: colors.textSecondary },
    mapSub: { ...Type.subheadline, color: colors.textMuted },
    // ── Milestone list ────────────────────────────────────────────────
    milestoneRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Space.s12,
      paddingVertical: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    milestoneOrdinal: {
      ...Type.footnote,
      color: colors.accent,
      width: 44,
      textAlign: 'right',
      // Level with the artist name's first line.
      paddingTop: (Type.headline.lineHeight - Type.footnote.lineHeight) / 2,
    },
    milestoneInfo: { flex: 1 },
    milestoneTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: Space.s8,
    },
    milestoneArtist: { ...Type.headline, color: colors.textPrimary, flex: 1 },
    milestoneDate: { ...Type.footnote, color: colors.accent },
    milestoneVenue: { ...Type.footnote, color: colors.textMuted },
    // ── Tablet 2-column ───────────────────────────────────────────────
    twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
    twoColLeft: { flex: 1 },
    twoColRight: { flex: 1 },
    twoColDivider: { width: 1, backgroundColor: colors.border, alignSelf: 'stretch' },
  });
}

export type StatsStyles = ReturnType<typeof createStatsStyles>;
