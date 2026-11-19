import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import BarChart from '@/components/charts/BarChart';
import WeekdayErasCard from '@/components/WeekdayErasCard';
import type { ChronicleColors } from '@/utils/colors';
import type { groupWeekdaysIntoEras } from '@/utils/weekdayEras';
import StatCard from './StatCard';
import type { StatsStyles } from './statsStyles';

type BarDatum = { id: string; label: string; value: number };

type Props = {
  styles: StatsStyles;
  colors: ChronicleColors;
  yearBarData: BarDatum[];
  weekdayBarData: BarDatum[];
  busiestYear: { year: string; shows: number } | null;
  busiestWeekday: { name: string; count: number } | null;
  weekdayEras: ReturnType<typeof groupWeekdaysIntoEras>;
};

export default function ConcertsSection({
  styles,
  colors,
  yearBarData,
  weekdayBarData,
  busiestYear,
  busiestWeekday,
  weekdayEras,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('stats.sectionConcerts')}</Text>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('stats.showsPerYear')}</Text>
        <BarChart data={yearBarData} height={90} />
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('stats.showsByDay')}</Text>
        <BarChart data={weekdayBarData} height={70} />
      </View>
      <View style={styles.cardRow}>
        <StatCard
          styles={styles}
          value={busiestYear?.year ?? '—'}
          valueColor={colors.chartOrange}
          label={t('stats.busiestYear', { count: busiestYear?.shows ?? 0 })}
        />
        <StatCard
          styles={styles}
          value={busiestWeekday?.name ?? '—'}
          valueColor={colors.accent}
          label={t('stats.mostCommonDay', { count: busiestWeekday?.count ?? 0 })}
        />
      </View>
      {weekdayEras.length > 0 && <WeekdayErasCard eras={weekdayEras} />}
    </View>
  );
}
