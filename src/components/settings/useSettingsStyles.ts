import { StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import { Type } from '@/utils/typography';
import { Space } from '@/utils/spacing';

// A 44 pt control in a row of one text line reaches into the row's padding by this much.
const ROW_LINE = Type.body.lineHeight;
const ROW_TARGET_MARGIN = -(TOUCH_TARGET - ROW_LINE) / 2;
export const CANCEL_ICON = 18;
// iOS reports a text field's frame inside its 1 pt border, so add both borders to the target.
const FIELD_HEIGHT = TOUCH_TARGET + 2;

// One StyleSheet for the whole screen: the screen calls this once and passes the result
// down to its sections.
export function useSettingsStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      // The chevron stays on the screen margin; the target reaches toward the title.
      justifyContent: 'center',
    },
    headerTitle: { ...Type.title1, color: colors.textPrimary, flex: 1 },
    // ── Section ──────────────────────────────────────────────────────────
    sectionLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      paddingHorizontal: Space.edge,
      paddingTop: Space.s32,
      paddingBottom: Space.s8,
    },
    // ── Rows ─────────────────────────────────────────────────────────────
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s16,
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
    rowDetail: { ...Type.footnote, color: colors.textSecondary },
    rowAction: { ...Type.body, color: colors.accent },
    // 44 pt tall inside the row: the target reaches into the row's padding.
    rowActionButton: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      marginVertical: ROW_TARGET_MARGIN,
      paddingLeft: Space.s12,
    },
    rowDestructive: { ...Type.headline, color: colors.danger ?? '#ff453a', flex: 1 },
    // ── Username edit ─────────────────────────────────────────────────────
    usernameInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: Space.s12,
      minHeight: FIELD_HEIGHT,
      marginVertical: -(FIELD_HEIGHT - ROW_LINE) / 2,
    },
    saveButton: {
      marginLeft: Space.s12,
      paddingHorizontal: Space.s16,
      minHeight: TOUCH_TARGET,
      marginVertical: ROW_TARGET_MARGIN,
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderRadius: 8,
    },
    saveButtonText: {
      ...Type.footnote,
      color: colors.textOnAccent,
    },
    cancelButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginVertical: ROW_TARGET_MARGIN,
      // Puts the icon's edge on the screen margin.
      marginRight: -(TOUCH_TARGET - CANCEL_ICON) / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // ── Sync button ───────────────────────────────────────────────────────
    syncRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: Space.s12,
    },
    syncText: { ...Type.headline, color: colors.accent, flex: 1 },
    syncTextDisabled: { ...Type.headline, color: colors.textMuted, flex: 1 },
  });
}

export type SettingsStyles = ReturnType<typeof useSettingsStyles>;
