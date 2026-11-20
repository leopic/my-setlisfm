import { StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

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
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
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
    // ── Controls (pinned above list) ────────────────────────────────────
    controls: {
      backgroundColor: colors.background,
      paddingTop: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 12,
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
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 8,
    },
    sortPill: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
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
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
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
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownItem: {
      paddingVertical: 13,
      paddingHorizontal: 18,
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
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    yearGhost: {
      ...Type.yearGhost,
      opacity: 0.18,
      color: colors.textPrimary,
      marginTop: -4,
    },
    yearSubLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      marginBottom: 8,
    },
    spineContainer: {
      borderLeftWidth: 1.5,
      borderLeftColor: colors.spineColor,
      marginLeft: 28,
      paddingLeft: 20,
    },
    riverEntry: {
      paddingVertical: 10,
      position: 'relative',
    },
    dot: {
      position: 'absolute',
      left: -25.5,
      top: 16,
      width: 9,
      height: 9,
      borderRadius: 4.5,
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
      marginRight: 8,
    },
    entryDate: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
      marginBottom: 2,
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
      marginTop: 2,
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
      paddingVertical: 10,
      paddingHorizontal: 16,
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
      marginRight: 8,
    },
  });
}

export type ConcertsStyles = ReturnType<typeof useConcertsStyles>;
