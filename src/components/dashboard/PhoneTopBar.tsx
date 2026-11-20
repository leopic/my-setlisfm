import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import HeaderActions from './HeaderActions';
import StatsLine, { type StatsTotals } from './StatsLine';

type Props = {
  onSync: () => void;
  // Left out while no concerts are synced yet.
  totals?: StatsTotals;
  lastSynced?: string | null;
};

export default function PhoneTopBar({ onSync, totals, lastSynced }: Props) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    // ── Phone top bar ─────────────────────────────────────────────────────
    topBar: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    appTitle: {
      ...Type.largeTitle,
      color: colors.textPrimary,
    },
    lastSynced: {
      ...Type.footnote,
      color: colors.textMuted,
      marginTop: 4,
    },
  });
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarRow}>
        {/* eslint-disable-next-line i18next/no-literal-string -- app name, not copy */}
        <Text style={styles.appTitle}>Chronicles</Text>
        <HeaderActions onSync={onSync} />
      </View>
      {totals && <StatsLine totals={totals} />}
      {lastSynced && (
        <Text style={styles.lastSynced}>{t('dashboard.lastSynced', { date: lastSynced })}</Text>
      )}
    </View>
  );
}
