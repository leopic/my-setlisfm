import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import LineChart, { type LineSeries } from '@/components/charts/LineChart';
import type { StatsStyles } from './statsStyles';

type Props = {
  styles: StatsStyles;
  series: LineSeries[];
  xLabels: string[];
};

export default function ArtistsSection({ styles, series, xLabels }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('stats.sectionArtists')}</Text>
      {series.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('stats.topArtistsOverTime')}</Text>
          <LineChart series={series} xLabels={xLabels} height={160} />
        </View>
      )}
    </View>
  );
}
