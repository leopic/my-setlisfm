import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { YearSummary } from './types';

type Props = {
  showCount: number;
  summary: YearSummary | undefined;
  monthNames: string[];
};

// Four stat cards for the selected year: shows, countries, cities, peak month.
export default function YearStatCards({ showCount, summary, monthNames }: Props) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    detailStatRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    detailStatCard: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    detailStatValue: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    detailStatLabel: {
      ...Type.label,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
  return (
    <View style={styles.detailStatRow}>
      <View style={styles.detailStatCard}>
        <Text style={[styles.detailStatValue, { color: colors.accent }]}>{showCount}</Text>
        <Text style={styles.detailStatLabel}>
          {t('dashboard.showsLabel', { count: showCount })}
        </Text>
      </View>
      <View style={styles.detailStatCard}>
        <Text style={[styles.detailStatValue, { color: colors.chartGreen }]}>
          {summary?.countries ?? '—'}
        </Text>
        <Text style={styles.detailStatLabel}>
          {t('dashboard.countryLabel', { count: summary?.countries ?? 0 })}
        </Text>
      </View>
      <View style={styles.detailStatCard}>
        <Text style={[styles.detailStatValue, { color: colors.chartOrange }]}>
          {summary?.cities ?? '—'}
        </Text>
        <Text style={styles.detailStatLabel}>
          {t('dashboard.cityLabel', { count: summary?.cities ?? 0 })}
        </Text>
      </View>
      <View style={styles.detailStatCard}>
        <Text style={[styles.detailStatValue, { color: colors.chartPurple }]}>
          {summary?.peakMonthCount ?? '—'}
        </Text>
        <Text style={styles.detailStatLabel}>
          {summary
            ? t('dashboard.peakMonth', { month: monthNames[summary.peakMonth - 1] })
            : t('dashboard.peak')}
        </Text>
      </View>
    </View>
  );
}
