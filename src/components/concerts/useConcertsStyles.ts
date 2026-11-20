import { StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import { Space } from '@/utils/spacing';
import { RIVER_DOT_TOP } from '@/components/river';
import { Corner, Radius } from '@/utils/radius';

// One StyleSheet for the whole screen: the screen calls this once and passes the result
// down to its sections.
export function useConcertsStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // ── Header ──────────────────────────────────────────────────────────
    header: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s12,
      paddingBottom: Space.s8,
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
    // ── Controls (pinned above list) ────────────────────────────────────
    controls: {
      backgroundColor: colors.background,
      paddingTop: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      paddingHorizontal: Space.edge,
      paddingBottom: Space.s12,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      ...Corner.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      padding: 0,
      margin: 0,
    },
    sortContainer: {
      flexDirection: 'row',
      paddingHorizontal: Space.edge,
      paddingBottom: Space.s8,
      gap: Space.s8,
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
    yearDropdownTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s4,
      minHeight: TOUCH_TARGET,
      paddingHorizontal: Space.s16,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
      alignSelf: 'flex-start',
    },
    yearDropdownTriggerActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    yearDropdownTriggerText: {
      ...Type.footnote,
      color: colors.textMuted,
    },
    yearDropdownTriggerTextActive: {
      color: colors.accent,
    },
    yearDropdownChevron: {
      ...Type.captionStrong,
      color: colors.textMuted,
    },
    yearDropdownChevronActive: {
      color: colors.accent,
    },
    // Modal overlay + sheet
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownSheet: {
      width: 220,
      maxHeight: 360,
      backgroundColor: colors.surface,
      ...Corner.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownItem: {
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemLast: {
      borderBottomWidth: 0,
    },
    dropdownItemText: {
      ...Type.body,
      color: colors.textPrimary,
    },
    dropdownItemTextActive: {
      ...Type.headline,
      color: colors.accent,
    },
    // ── Timeline river ──────────────────────────────────────────────────
    yearSection: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s12,
    },
    yearGhost: {
      ...Type.yearGhost,
      opacity: 0.18,
      color: colors.textPrimary,
      marginTop: -Space.s4,
    },
    yearSubLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      marginBottom: Space.s8,
    },
    spineContainer: {
      borderLeftWidth: 1.5,
      borderLeftColor: colors.spineColor,
      marginLeft: Space.s32,
      paddingLeft: Space.s20,
    },
    riverEntry: {
      paddingVertical: Space.s12,
      position: 'relative',
    },
    dot: {
      position: 'absolute',
      left: -25.5,
      top: RIVER_DOT_TOP,
      width: 9,
      height: 9,
      borderRadius: Radius.full,
      backgroundColor: colors.dotInactive,
      borderWidth: 2,
      borderColor: colors.background,
    },
    dotActive: {
      backgroundColor: colors.dotActive,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    entryContent: {
      flex: 1,
      marginRight: Space.s8,
    },
    entryDate: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
    },
    entryArtist: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    entryVenue: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    entryTour: {
      ...Type.subheadline,
      color: colors.accent,
    },
    entryChevron: {
      ...Type.body,
      color: colors.textDisabled,
      alignSelf: 'center',
    },
    // ── Tablet master-detail ─────────────────────────────────────────────
    masterDetail: { flex: 1, flexDirection: 'row' },
    sidebar: { borderRightWidth: 1, borderRightColor: colors.border },
    detailPane: { flex: 1 },
    riverEntrySelected: { backgroundColor: colors.accentSoft },
    // ── Alphabetical list ────────────────────────────────────────────────
    alphabeticalEntry: {
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    alphabeticalEntryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    alphabeticalEntryContent: {
      flex: 1,
      marginRight: Space.s8,
    },
  });
}

export type ConcertsStyles = ReturnType<typeof useConcertsStyles>;
