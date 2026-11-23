import { useState, useEffect } from 'react';
import { View, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useIsFocused } from 'expo-router';
import { useSyncContext } from '@/contexts/SyncContext';
import { dbOperations } from '@/database/operations';
import { useChronicleColors } from '@/utils/colors';
import { EmptyState } from '@/components/ui';
import { groupWeekdaysIntoEras } from '@/utils/weekdayEras';
import { useTabletLayout } from '@/utils/tablet';
import { useTranslation } from 'react-i18next';
import ArtistsSection from '@/components/stats/ArtistsSection';
import ConcertsSection from '@/components/stats/ConcertsSection';
import PlacesSection from '@/components/stats/PlacesSection';
import StatsHeader, { StatsTotals } from '@/components/stats/StatsHeader';
import { useLargeTitleOptions } from '@/utils/largeTitle';
import StorySection from '@/components/stats/StorySection';
import {
  ARTIST_COLORS_DARK,
  ARTIST_COLORS_LIGHT,
  buildArtistSeries,
  buildArtistXLabels,
  buildWeekdayBarData,
  buildYearBarData,
  findBusiestWeekday,
  findBusiestYear,
  type StatsChartData,
  type YearSummaries,
} from '@/components/stats/statsData';
import { createStatsStyles } from '@/components/stats/statsStyles';

export default function StatsScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const { lastSyncTimestamp } = useSyncContext();
  const { isTablet } = useTabletLayout();
  // Phone: the native large title, which collapses as the charts scroll. The iPad and the
  // empty state keep their own header; header options outlive the branch that set them, so
  // each branch sets them.
  const largeTitle = useLargeTitleOptions(t('stats.title'));
  const noLargeTitle = <Stack.Screen options={{ headerShown: false }} />;
  const scheme = useColorScheme();
  const artistColors = scheme === 'dark' ? ARTIST_COLORS_DARK : ARTIST_COLORS_LIGHT;

  const [yearSummaries, setYearSummaries] = useState<YearSummaries>([]);
  const [chartData, setChartData] = useState<StatsChartData>({
    weekdays: [],
    weekdaysByYear: [],
    milestones: [],
    topArtistsPerYear: [],
    topCountry: null,
    topCity: null,
  });
  const [totalShows, setTotalShows] = useState(0);
  const [totalCountries, setTotalCountries] = useState(0);
  const [topCountry, setTopCountry] = useState<{ name: string; pct: number } | null>(null);
  const [topCity, setTopCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load on focus, and again when a sync ends while the screen is open. Not
  // useFocusEffect(useCallback(…)): React Compiler keeps only the useCallback deps the
  // callback reads, so it dropped lastSyncTimestamp. It keeps an effect's deps as written.
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    (async () => {
      try {
        const [summaries, charts, placesInsights] = await Promise.all([
          dbOperations.getYearSummaries(),
          dbOperations.getStatsChartData(),
          dbOperations.getPlacesInsights(),
        ]);
        if (!cancelled) {
          setYearSummaries(summaries);
          setChartData(charts);
          setTotalShows(summaries.reduce((s, r) => s + r.shows, 0));
          setTotalCountries(placesInsights.countryTimeline.total);
          setTopCountry(charts.topCountry);
          setTopCity(charts.topCity);
          setLoading(false);
        }
      } catch (e) {
        console.error('Stats load error:', e);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused, lastSyncTimestamp]);

  const styles = createStatsStyles(colors);

  const yearBarData = buildYearBarData(yearSummaries);
  const artistSeries = buildArtistSeries(yearSummaries, chartData.topArtistsPerYear, artistColors);
  const artistXLabels = buildArtistXLabels(yearSummaries);
  const busiestYear = findBusiestYear(yearSummaries);
  const busiestWeekday = findBusiestWeekday(chartData.weekdays, t);
  const weekdayBarData = buildWeekdayBarData(chartData.weekdays, t);
  const weekdayEras = groupWeekdaysIntoEras(chartData.weekdaysByYear);

  // Each section renders once; the tablet layout puts them in two columns, the phone in one.
  const artistsSection = (
    <ArtistsSection styles={styles} series={artistSeries} xLabels={artistXLabels} />
  );

  const storySection = (
    <StorySection
      styles={styles}
      colors={colors}
      milestones={chartData.milestones}
      totalShows={totalShows}
      totalCountries={totalCountries}
    />
  );

  const concertsSection = (
    <ConcertsSection
      styles={styles}
      colors={colors}
      yearBarData={yearBarData}
      weekdayBarData={weekdayBarData}
      busiestYear={busiestYear}
      busiestWeekday={busiestWeekday}
      weekdayEras={weekdayEras}
    />
  );

  const placesSection = (
    <PlacesSection
      styles={styles}
      colors={colors}
      totalCountries={totalCountries}
      topCountry={topCountry}
      topCity={topCity}
    />
  );

  // A phone shows the large title while it loads, so nothing moves when the charts arrive.
  if (loading) {
    if (!isTablet) {
      return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.container}>
          <Stack.Screen options={largeTitle} />
          <ScrollView
            testID="stats-loading"
            style={styles.scroll}
            contentInsetAdjustmentBehavior="automatic"
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
        {noLargeTitle}
        <StatsHeader styles={styles} />
      </SafeAreaView>
    );
  }

  if (yearSummaries.length === 0) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="stats-screen">
        {noLargeTitle}
        <StatsHeader styles={styles} />
        <EmptyState
          icon={{ sf: 'chart.bar', md: 'bar-chart-outline' }}
          title={t('stats.emptyTitle')}
          body={t('stats.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  const totals = { shows: totalShows, countries: totalCountries };
  return (
    <SafeAreaView
      edges={isTablet ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']}
      style={styles.container}
      testID="stats-screen"
    >
      {isTablet ? (
        <>
          {noLargeTitle}
          <StatsHeader styles={styles} totals={totals} />
        </>
      ) : (
        <Stack.Screen options={largeTitle} />
      )}

      <ScrollView
        testID="stats-scroll"
        style={styles.scroll}
        contentInsetAdjustmentBehavior={isTablet ? undefined : 'automatic'}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isTablet ? (
          <View style={styles.twoColRow}>
            <View style={styles.twoColLeft} testID="stats-column-left">
              {artistsSection}
              <View style={styles.divider} />
              {storySection}
            </View>
            <View style={styles.twoColDivider} />
            <View style={styles.twoColRight} testID="stats-column-right">
              {concertsSection}
              <View style={styles.divider} />
              {placesSection}
            </View>
          </View>
        ) : (
          <>
            <StatsTotals style={[styles.headerSub, styles.largeTitleSubtitle]} totals={totals} />
            {artistsSection}
            <View style={styles.divider} />
            {storySection}
            <View style={styles.divider} />
            {concertsSection}
            <View style={styles.divider} />
            {placesSection}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
