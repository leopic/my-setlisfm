import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
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
import { useTabletLayout } from '@/utils/tablet';
import { Ionicons } from '@expo/vector-icons';

const ARTIST_COLORS_DARK = ['#00e8ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff6b6b'];
const ARTIST_COLORS_LIGHT = ['#0066bb', '#b45309', '#16a34a', '#7c3aed', '#dc2626'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function StatsScreen() {
  const colors = useChronicleColors();
  const router = useRouter();
  const { lastSyncTimestamp } = useSyncContext();
  const { isTablet } = useTabletLayout();
  const scheme = useColorScheme();
  const artistColors = scheme === 'dark' ? ARTIST_COLORS_DARK : ARTIST_COLORS_LIGHT;

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
        mapLabel: { ...Type.title, color: colors.textSecondary },
        mapSub: { ...Type.body, color: colors.textMuted },
        // ── Milestone list ────────────────────────────────────────────────
        milestoneRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        milestoneOrdinal: {
          ...Type.label,
          color: colors.accent,
          width: 36,
          textAlign: 'right',
          paddingTop: 1,
        },
        milestoneInfo: { flex: 1 },
        milestoneTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
        },
        milestoneArtist: { ...Type.body, color: colors.textPrimary, fontWeight: '600', flex: 1 },
        milestoneDate: { ...Type.label, color: colors.accent },
        milestoneVenue: { ...Type.label, color: colors.textMuted, marginTop: 2 },
        // ── Tablet 2-column ───────────────────────────────────────────────
        twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
        twoColLeft: { flex: 1 },
        twoColRight: { flex: 1 },
        twoColDivider: { width: 1, backgroundColor: colors.border, alignSelf: 'stretch' },
      }),
    [colors],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);

  // ── Derived chart data ─────────────────────────────────────────────────────

  const yearBarData = useMemo(
    () =>
      [...yearSummaries]
        .sort((a, b) => a.year.localeCompare(b.year))
        .map((r) => ({ label: r.year.slice(2), value: r.shows })),
    [yearSummaries],
  );

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
      return { label: name, color: artistColors[i % artistColors.length], data };
    });
  }, [chartData.topArtistsPerYear, yearSummaries, artistColors]);

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
    const name = DAY_FULL_LABELS[top.weekday];
    return name ? { name, count: top.concertDays } : null;
  }, [chartData.weekdays]);

  const weekdayBarData = useMemo(
    () =>
      DAY_LABELS.map((label, i) => ({
        label,
        value: chartData.weekdays.find((w) => w.weekday === i)?.concertDays ?? 0,
      })),
    [chartData.weekdays],
  );

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
            {/* Left column: ARTISTS + YOUR STORY */}
            <View style={styles.twoColLeft}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ARTISTS</Text>
                {artistSeries.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>TOP 5 OVER TIME</Text>
                    <LineChart series={artistSeries} xLabels={artistXLabels} height={160} />
                  </View>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>YOUR STORY</Text>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>MILESTONES</Text>
                  {chartData.milestones.map((m, i) => (
                    <View
                      key={m.number}
                      style={[
                        styles.milestoneRow,
                        i === chartData.milestones.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <Text style={styles.milestoneOrdinal}>{ordinal(m.number)}</Text>
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
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.accent }]}>{totalShows}</Text>
                    <Text style={styles.statLabel}>total shows</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.chartGreen }]}>
                      {totalCountries}
                    </Text>
                    <Text style={styles.statLabel}>countries visited</Text>
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
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>SHOWS BY DAY</Text>
                  <BarChart data={weekdayBarData} height={70} />
                </View>
                <View style={styles.cardRow}>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.chartOrange }]}>
                      {busiestYear?.year ?? '—'}
                    </Text>
                    <Text style={styles.statLabel}>
                      busiest year · {busiestYear?.shows ?? 0} shows
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.accent }]}>
                      {busiestWeekday?.name ?? '—'}
                    </Text>
                    <Text style={styles.statLabel}>
                      most common day · {busiestWeekday?.count ?? 0} shows
                    </Text>
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
                  <Ionicons
                    name="map-outline"
                    size={36}
                    color={colors.accent}
                    style={{ opacity: 0.6 }}
                  />
                  <Text style={styles.mapLabel}>World Map</Text>
                  <Text style={styles.mapSub}>{totalCountries} countries · tap to explore</Text>
                </View>
              </TouchableOpacity>
              <View style={[styles.cardRow, { paddingHorizontal: 20, marginBottom: 20 }]}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.chartGreen }]}>
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
              <Text style={styles.sectionLabel}>ARTISTS</Text>
              {artistSeries.length > 0 && (
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>TOP 5 OVER TIME</Text>
                  <LineChart series={artistSeries} xLabels={artistXLabels} height={160} />
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>YOUR STORY</Text>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>MILESTONES</Text>
                {chartData.milestones.map((m, i) => (
                  <View
                    key={m.number}
                    style={[
                      styles.milestoneRow,
                      i === chartData.milestones.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={styles.milestoneOrdinal}>{ordinal(m.number)}</Text>
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
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>{totalShows}</Text>
                  <Text style={styles.statLabel}>total shows</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.chartGreen }]}>
                    {totalCountries}
                  </Text>
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
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>SHOWS BY DAY</Text>
                <BarChart data={weekdayBarData} height={70} />
              </View>
              <View style={styles.cardRow}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.chartOrange }]}>
                    {busiestYear?.year ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>
                    busiest year · {busiestYear?.shows ?? 0} shows
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {busiestWeekday?.name ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>
                    most common day · {busiestWeekday?.count ?? 0} shows
                  </Text>
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
                <Ionicons
                  name="map-outline"
                  size={36}
                  color={colors.accent}
                  style={{ opacity: 0.6 }}
                />
                <Text style={styles.mapLabel}>World Map</Text>
                <Text style={styles.mapSub}>{totalCountries} countries · tap to explore</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.cardRow, { paddingHorizontal: 20, marginBottom: 20 }]}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.chartGreen }]}>
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
