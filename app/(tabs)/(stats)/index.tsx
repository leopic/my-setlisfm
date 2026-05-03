import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSyncContext } from '@/contexts/SyncContext';
import { dbOperations } from '@/database/operations';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatDate } from '@/utils/date';
import { EmptyState } from '@/components/ui';
import BarChart from '@/components/charts/BarChart';
import LineChart, { type LineSeries } from '@/components/charts/LineChart';
import AreaChart, { type Milestone } from '@/components/charts/AreaChart';
import { useTabletLayout } from '@/utils/tablet';

const ARTIST_COLORS = ['#00e8ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff6b6b'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StatsScreen() {
  const colors = useChronicleColors();
  const router = useRouter();
  const { lastSyncTimestamp } = useSyncContext();
  const { isTablet } = useTabletLayout();

  const [yearSummaries, setYearSummaries] = useState<
    Awaited<ReturnType<typeof dbOperations.getYearSummaries>>
  >([]);
  const [chartData, setChartData] = useState<
    Awaited<ReturnType<typeof dbOperations.getStatsChartData>>
  >({ weekdays: [], milestones: [], topArtistsPerYear: [], topCountry: null, topCity: null });
  const [totalShows, setTotalShows] = useState(0);
  const [totalCountries, setTotalCountries] = useState(0);
  const [topCountry, setTopCountry] = useState<{ name: string; pct: number } | null>(null);
  const [topCity, setTopCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [lastSyncTimestamp]);

  const load = async () => {
    try {
      setLoading(true);
      const [summaries, charts, placesInsights] = await Promise.all([
        dbOperations.getYearSummaries(),
        dbOperations.getStatsChartData(),
        dbOperations.getPlacesInsights(),
      ]);
      setYearSummaries(summaries);
      setChartData(charts);

      const total = summaries.reduce((s, r) => s + r.shows, 0);
      setTotalShows(total);

      // Places stats
      setTotalCountries(placesInsights.countryTimeline.total);
      setTopCountry(charts.topCountry);
      setTopCity(charts.topCity);
    } catch (e) {
      console.error('Stats load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitle: { ...Type.heading, color: colors.textPrimary },
        headerSub: { ...Type.body, color: colors.textSecondary, marginTop: 2 },
        scroll: { flex: 1 },
        content: { paddingBottom: 48 },
        section: {
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 4,
        },
        sectionLabel: {
          ...Type.label,
          color: colors.textMuted,
          letterSpacing: 1.5,
          marginBottom: 12,
        },
        chartCard: {
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          marginBottom: 10,
        },
        chartTitle: {
          ...Type.label,
          color: colors.textMuted,
          marginBottom: 10,
          letterSpacing: 0.6,
        },
        cardRow: { flexDirection: 'row', gap: 10 },
        statCard: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
        },
        statValue: { ...Type.heading, color: colors.textPrimary, lineHeight: 26 },
        statLabel: { ...Type.body, color: colors.textSecondary, marginTop: 3 },
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginHorizontal: 20,
          marginTop: 16,
        },
        mapCard: {
          marginHorizontal: 20,
          marginBottom: 10,
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          height: 160,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        mapInner: { alignItems: 'center', gap: 6 },
        mapIcon: { ...Type.display, fontSize: 36, color: colors.accent, opacity: 0.6 },
        mapLabel: { ...Type.title, color: colors.textSecondary },
        mapSub: { ...Type.body, color: colors.textMuted },
        // ── Tablet 2-column ───────────────────────────────────────────────
        twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
        twoColLeft: { flex: 1 },
        twoColRight: { flex: 1 },
        twoColDivider: { width: 1, backgroundColor: colors.border, alignSelf: 'stretch' },
      }),
    [colors],
  );

  // ── Derived chart data ─────────────────────────────────────────────────────

  const yearBarData = useMemo(
    () =>
      [...yearSummaries]
        .sort((a, b) => a.year.localeCompare(b.year))
        .map((r) => ({ label: r.year.slice(2), value: r.shows })),
    [yearSummaries],
  );

  const cumulativeData = useMemo(() => {
    const sorted = [...yearSummaries].sort((a, b) => a.year.localeCompare(b.year));
    let running = 0;
    return sorted.map((r) => {
      running += r.shows;
      return running;
    });
  }, [yearSummaries]);

  const milestoneAnnotations: Milestone[] = useMemo(() => {
    const sorted = [...yearSummaries].sort((a, b) => a.year.localeCompare(b.year));
    return chartData.milestones.map((m) => {
      // Find which year index this milestone falls in
      let cumul = 0;
      let idx = 0;
      for (let i = 0; i < sorted.length; i++) {
        cumul += sorted[i].shows;
        if (cumul >= m.number) {
          idx = i;
          break;
        }
      }
      return {
        index: idx,
        label: `${m.number}${m.number === 1 ? 'st' : m.number === 2 ? 'nd' : m.number === 3 ? 'rd' : 'th'}`,
      };
    });
  }, [chartData.milestones, yearSummaries]);

  const artistSeries: LineSeries[] = useMemo(() => {
    const sorted = [...yearSummaries].sort((a, b) => a.year.localeCompare(b.year));
    const allYears = sorted.map((r) => r.year);

    // Group by artist
    const byArtist = new Map<string, Map<string, number>>();
    for (const row of chartData.topArtistsPerYear) {
      if (!byArtist.has(row.artistName)) byArtist.set(row.artistName, new Map());
      byArtist.get(row.artistName)?.set(row.year, row.shows);
    }

    return Array.from(byArtist.entries()).map(([name, yearMap], i) => {
      let cumul = 0;
      const data = allYears.map((yr) => {
        cumul += yearMap.get(yr) ?? 0;
        return cumul;
      });
      return { label: name, color: ARTIST_COLORS[i % ARTIST_COLORS.length], data };
    });
  }, [chartData.topArtistsPerYear, yearSummaries]);

  const artistXLabels = useMemo(
    () =>
      [...yearSummaries]
        .sort((a, b) => a.year.localeCompare(b.year))
        .map((r) => `'${r.year.slice(2)}`),
    [yearSummaries],
  );

  const busiestYear = useMemo(() => {
    if (!yearSummaries.length) return null;
    return yearSummaries.reduce((a, b) => (a.shows > b.shows ? a : b));
  }, [yearSummaries]);

  const busiestWeekday = useMemo(() => {
    if (!chartData.weekdays.length) return null;
    const top = chartData.weekdays.reduce((a, b) => (a.concertDays > b.concertDays ? a : b));
    return DAY_LABELS[top.weekday] ?? null;
  }, [chartData.weekdays]);

  const firstMilestone = chartData.milestones.find((m) => m.number === 1);

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stats</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (yearSummaries.length === 0) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="stats-screen">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stats</Text>
        </View>
        <EmptyState
          icon={{ sf: 'chart.bar', md: 'bar-chart-outline' }}
          title="Nothing to chart yet"
          body="Your stats come to life once you sync some concerts."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.container}
      testID="stats-screen"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stats</Text>
        <Text style={styles.headerSub}>
          {totalShows} shows · {totalCountries} countries
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isTablet ? (
          /* ── Tablet: 2-column layout ────────────────────────────────────── */
          <View style={styles.twoColRow}>
            {/* Left column: YOUR STORY + ARTISTS */}
            <View style={styles.twoColLeft}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>YOUR STORY</Text>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>GROWTH OVER TIME</Text>
                  <AreaChart data={cumulativeData} milestones={milestoneAnnotations} height={120} />
                </View>
                <View style={styles.cardRow}>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.accent }]}>{totalShows}</Text>
                    <Text style={styles.statLabel}>total shows</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#30d158' }]}>{totalCountries}</Text>
                    <Text style={styles.statLabel}>countries visited</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ARTISTS</Text>
                {artistSeries.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>TOP 5 OVER TIME</Text>
                    <LineChart series={artistSeries} xLabels={artistXLabels} height={110} />
                  </View>
                )}
                <View style={styles.cardRow}>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#bf5af2' }]}>
                      {firstMilestone ? firstMilestone.artistName.split(' ')[0] : '—'}
                    </Text>
                    <Text style={styles.statLabel}>
                      {firstMilestone
                        ? `1st show · ${formatDate(firstMilestone.eventDate)}`
                        : 'first show'}
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#ff6b6b' }]}>
                      {chartData.milestones
                        .find((m) => m.number === 100)
                        ?.artistName?.split(' ')[0] ?? '—'}
                    </Text>
                    <Text style={styles.statLabel}>100th show artist</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Column divider */}
            <View style={styles.twoColDivider} />

            {/* Right column: CONCERTS + PLACES */}
            <View style={styles.twoColRight}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CONCERTS</Text>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>SHOWS PER YEAR</Text>
                  <BarChart data={yearBarData} height={90} />
                </View>
                <View style={styles.cardRow}>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#ff9f0a' }]}>
                      {busiestYear?.year ?? '—'}
                    </Text>
                    <Text style={styles.statLabel}>
                      busiest year · {busiestYear?.shows ?? 0} shows
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.accent }]}>
                      {busiestWeekday ?? '—'}
                    </Text>
                    <Text style={styles.statLabel}>most common day</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PLACES</Text>
              </View>
              <TouchableOpacity
                style={styles.mapCard}
                onPress={() => router.push('/(stats)/map')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open world map"
              >
                <View style={styles.mapInner}>
                  <Text style={styles.mapIcon}>🗺</Text>
                  <Text style={styles.mapLabel}>World Map</Text>
                  <Text style={styles.mapSub}>{totalCountries} countries · tap to explore</Text>
                </View>
              </TouchableOpacity>
              <View style={[styles.cardRow, { paddingHorizontal: 20, marginBottom: 20 }]}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#30d158' }]}>
                    {topCountry?.name ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>
                    {topCountry ? `${topCountry.pct}% of shows` : 'top country'}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>{topCity ?? '—'}</Text>
                  <Text style={styles.statLabel}>most visited city</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ── Phone: single-column layout ────────────────────────────────── */
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YOUR STORY</Text>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>GROWTH OVER TIME</Text>
                <AreaChart data={cumulativeData} milestones={milestoneAnnotations} height={120} />
              </View>
              <View style={styles.cardRow}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>{totalShows}</Text>
                  <Text style={styles.statLabel}>total shows</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#30d158' }]}>{totalCountries}</Text>
                  <Text style={styles.statLabel}>countries visited</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONCERTS</Text>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>SHOWS PER YEAR</Text>
                <BarChart data={yearBarData} height={90} />
              </View>
              <View style={styles.cardRow}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#ff9f0a' }]}>
                    {busiestYear?.year ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>
                    busiest year · {busiestYear?.shows ?? 0} shows
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {busiestWeekday ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>most common day</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ARTISTS</Text>
              {artistSeries.length > 0 && (
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>TOP 5 OVER TIME</Text>
                  <LineChart series={artistSeries} xLabels={artistXLabels} height={110} />
                </View>
              )}
              <View style={styles.cardRow}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#bf5af2' }]}>
                    {firstMilestone ? firstMilestone.artistName.split(' ')[0] : '—'}
                  </Text>
                  <Text style={styles.statLabel}>
                    {firstMilestone
                      ? `1st show · ${formatDate(firstMilestone.eventDate)}`
                      : 'first show'}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#ff6b6b' }]}>
                    {chartData.milestones
                      .find((m) => m.number === 100)
                      ?.artistName?.split(' ')[0] ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>100th show artist</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PLACES</Text>
            </View>
            <TouchableOpacity
              style={styles.mapCard}
              onPress={() => router.push('/(stats)/map')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Open world map"
            >
              <View style={styles.mapInner}>
                <Text style={styles.mapIcon}>🗺</Text>
                <Text style={styles.mapLabel}>World Map</Text>
                <Text style={styles.mapSub}>{totalCountries} countries · tap to explore</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.cardRow, { paddingHorizontal: 20, marginBottom: 20 }]}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#30d158' }]}>
                  {topCountry?.name ?? '—'}
                </Text>
                <Text style={styles.statLabel}>
                  {topCountry ? `${topCountry.pct}% of shows` : 'top country'}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.accent }]}>{topCity ?? '—'}</Text>
                <Text style={styles.statLabel}>most visited city</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
