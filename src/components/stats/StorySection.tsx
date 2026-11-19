import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ChronicleColors } from '@/utils/colors';
import { formatDate } from '@/utils/date';
import { toOrdinal } from '@/utils/ordinal';
import StatCard from './StatCard';
import type { StatsStyles } from './statsStyles';
import type { StatsChartData } from './statsData';

type Props = {
  styles: StatsStyles;
  colors: ChronicleColors;
  milestones: StatsChartData['milestones'];
  totalShows: number;
  totalCountries: number;
};

export default function StorySection({
  styles,
  colors,
  milestones,
  totalShows,
  totalCountries,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('stats.sectionStory')}</Text>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('stats.milestones')}</Text>
        {milestones.map((m, i) => (
          <View
            key={m.number}
            style={[styles.milestoneRow, i === milestones.length - 1 && { borderBottomWidth: 0 }]}
          >
            <Text style={styles.milestoneOrdinal}>{toOrdinal(m.number)}</Text>
            <View style={styles.milestoneInfo}>
              <View style={styles.milestoneTopRow}>
                <Text style={styles.milestoneArtist}>{m.artistName}</Text>
                <Text style={styles.milestoneDate}>{formatDate(m.eventDate)}</Text>
              </View>
              <Text style={styles.milestoneVenue}>
                {[m.venueName, m.cityName].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.cardRow}>
        <StatCard
          styles={styles}
          value={totalShows}
          valueColor={colors.accent}
          label={t('stats.totalShows')}
        />
        <StatCard
          styles={styles}
          value={totalCountries}
          valueColor={colors.chartGreen}
          label={t('stats.countriesVisited')}
        />
      </View>
    </View>
  );
}
