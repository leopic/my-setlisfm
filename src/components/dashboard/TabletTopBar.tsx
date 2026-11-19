import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import HeaderActions from './HeaderActions';
import CompactOnThisDayCard from './CompactOnThisDayCard';
import StatsLine, { type StatsTotals } from './StatsLine';
import type { OnThisDayConcert } from './types';

type Props = { totals: StatsTotals; onThisDay: OnThisDayConcert; onSync: () => void };

export default function TabletTopBar({ totals, onThisDay, onSync }: Props) {
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    tabletTopBar: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabletTopBarLeft: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 10,
      justifyContent: 'center',
    },
    tabletTopBarRight: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 12,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    appTitle: {
      ...Type.display,
      color: colors.textPrimary,
    },
  });
  return (
    <View style={styles.tabletTopBar}>
      <View style={styles.tabletTopBarLeft}>
        {/* eslint-disable-next-line i18next/no-literal-string -- app name, not copy */}
        <Text style={styles.appTitle}>Chronicles</Text>
        <StatsLine totals={totals} />
      </View>
      <View style={styles.tabletTopBarRight}>
        {onThisDay && <CompactOnThisDayCard concert={onThisDay} variant="header" />}
        <HeaderActions onSync={onSync} style={{ marginLeft: 'auto' }} />
      </View>
    </View>
  );
}
