import { StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

// One StyleSheet for the whole screen: the screen calls this once and passes the result
// down to its sections.
export function useSettingsStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    backButton: { padding: 4 },
    headerTitle: { ...Type.heading, color: colors.textPrimary, flex: 1 },
    // ── Section ──────────────────────────────────────────────────────────
    sectionLabel: {
      ...Type.label,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 8,
    },
    // ── Rows ─────────────────────────────────────────────────────────────
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowFirst: { borderTopWidth: 1, borderTopColor: colors.border },
    // The label stays on the first line of a two-line value.
    rowTop: { alignItems: 'flex-start' },
    rowLabel: { ...Type.body, color: colors.textSecondary, width: 110 },
    rowValue: { ...Type.body, color: colors.textPrimary, flex: 1 },
    rowValueColumn: { flex: 1 },
    rowValueText: { ...Type.body, color: colors.textPrimary },
    rowDetail: { ...Type.label, color: colors.textSecondary, marginTop: 2 },
    rowAction: { ...Type.body, color: colors.accent },
    rowDestructive: { ...Type.title, color: colors.danger ?? '#ff453a', flex: 1 },
    // ── Username edit ─────────────────────────────────────────────────────
    usernameInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    saveButton: {
      marginLeft: 10,
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: colors.accent,
      borderRadius: 8,
    },
    saveButtonText: {
      ...Type.label,
      color: colors.textOnAccent,
    },
    cancelButton: { marginLeft: 8, padding: 6 },
    // ── Sync button ───────────────────────────────────────────────────────
    syncRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    syncText: { ...Type.title, color: colors.accent, flex: 1 },
    syncTextDisabled: { ...Type.title, color: colors.textMuted, flex: 1 },
  });
}

export type SettingsStyles = ReturnType<typeof useSettingsStyles>;
