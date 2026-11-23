import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import HeaderActions from './HeaderActions';
import StatsLine, { type StatsTotals } from './StatsLine';
import { Space } from '@/utils/spacing';
import { formatSince } from '@/utils/since';
import { useNow } from '@/utils/useNow';

type Props = {
  onSync: () => void;
  // Left out while no concerts are synced yet.
  totals?: StatsTotals;
  lastSyncedAt?: Date | null;
};

export default function PhoneTopBar({ onSync, totals, lastSyncedAt }: Props) {
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    // ── Phone top bar ─────────────────────────────────────────────────────
    topBar: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s12,
      paddingBottom: Space.s16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Space.s4,
    },
    appTitle: {
      ...Type.largeTitle,
      color: colors.textPrimary,
    },
  });
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarRow}>
        {/* eslint-disable-next-line i18next/no-literal-string -- app name, not copy */}
        <Text style={styles.appTitle}>Chronicles</Text>
        <HeaderActions onSync={onSync} />
      </View>
      <DashboardSummary totals={totals} lastSyncedAt={lastSyncedAt} />
    </View>
  );
}

// The totals and when the last sync ran: under the top bar's title, or under the native large
// title.
export function DashboardSummary({
  totals,
  lastSyncedAt,
  style,
}: Pick<Props, 'totals' | 'lastSyncedAt'> & { style?: StyleProp<ViewStyle> }) {
  const now = useNow();
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    lastSynced: {
      ...Type.footnote,
      color: colors.textMuted,
      marginTop: Space.s4,
    },
  });
  return (
    <View style={style}>
      {totals && <StatsLine totals={totals} />}
      {lastSyncedAt && (
        <Text style={styles.lastSynced}>
          {t('dashboard.lastSynced', { when: formatSince(lastSyncedAt, now) })}
        </Text>
      )}
    </View>
  );
}
