import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ChronicleColors } from '@/utils/colors';
import StatCard from './StatCard';
import type { StatsStyles } from './statsStyles';
import { Space } from '@/utils/spacing';
import { IconSize } from '@/utils/iconSize';

type Props = {
  styles: StatsStyles;
  colors: ChronicleColors;
  totalCountries: number;
  topCountry: { name: string; pct: number } | null;
  topCity: string | null;
};

export default function PlacesSection({
  styles,
  colors,
  totalCountries,
  topCountry,
  topCity,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('stats.sectionPlaces')}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.mapCard, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => router.push('/(stats)/map')}
        accessibilityRole="button"
        accessibilityLabel={t('stats.openWorldMap')}
      >
        <View style={styles.mapInner}>
          <Ionicons
            name="map-outline"
            size={IconSize.largeTitle}
            color={colors.accent}
            style={{ opacity: 0.6 }}
          />
          <Text style={styles.mapLabel}>{t('stats.worldMap')}</Text>
          <Text style={styles.mapSub}>{t('stats.worldMapHint', { count: totalCountries })}</Text>
        </View>
      </Pressable>
      <View style={[styles.cardRow, { paddingHorizontal: Space.edge, marginBottom: Space.s20 }]}>
        <StatCard
          styles={styles}
          value={topCountry?.name ?? '—'}
          valueColor={colors.chartGreen}
          label={
            topCountry ? t('stats.topCountryShare', { pct: topCountry.pct }) : t('stats.topCountry')
          }
        />
        <StatCard
          styles={styles}
          value={topCity ?? '—'}
          valueColor={colors.accent}
          label={t('stats.mostVisitedCity')}
        />
      </View>
    </>
  );
}
