import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

export type StatsTotals = { concerts: number; artists: number; countries: number };

export default function StatsLine({ totals }: { totals: StatsTotals }) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    statsLine: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
  });
  return (
    <Text style={styles.statsLine}>
      {[
        t('common.show', { count: totals.concerts }),
        t('common.artist', { count: totals.artists }),
        t('common.country', { count: totals.countries }),
      ].join(' · ')}
    </Text>
  );
}
