import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import { syncConcertData, getStoredUsername, setStoredUsername } from '@/services/syncService';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useSyncContext } from '@/contexts/SyncContext';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import InsightCards from '@/components/InsightCards';
import ArtistImage from '@/components/ArtistImage';
import BarChart from '@/components/charts/BarChart';
import { TabScrollView, Icon, EmptyState } from '@/components/ui';
import { useTabletLayout } from '@/utils/tablet';

type DashboardStats = Awaited<ReturnType<typeof dbOperations.getDashboardStats>>;
type OnThisDayConcert = Awaited<ReturnType<typeof dbOperations.getOnThisDayConcert>>;

const YEAR_GRID_WIDTH = 260;

const emptyStats: DashboardStats = {
  totalConcerts: 0,
  totalArtists: 0,
  totalVenues: 0,
  totalCountries: 0,
  topArtist: null,
  topVenue: null,
  firstConcert: null,
  lastConcert: null,
  concertsByYear: [],
};

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const { isTablet } = useTabletLayout();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        // ── Phone top bar ─────────────────────────────────────────────────────
        topBar: {
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        topBarRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        },
        appTitle: {
          ...Type.display,
          color: colors.textPrimary,
        },
        topBarActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        },
        statsLine: {
          ...Type.body,
          color: colors.textSecondary,
        },
        lastSynced: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 4,
        },
        // ── Tablet top bar ────────────────────────────────────────────────────
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
        // ── Header OTD card (compact, tablet only) ────────────────────────────
        headerOtdCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.accent,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        headerOtdLabel: {
          ...Type.label,
          fontSize: 9,
          color: colors.accent,
          letterSpacing: 0.8,
          marginBottom: 1,
        },
        headerOtdName: {
          ...Type.body,
          fontWeight: '600',
          color: colors.textPrimary,
          fontSize: 12,
        },
        headerOtdMeta: {
          ...Type.label,
          fontSize: 10,
          color: colors.textSecondary,
        },
        // ── Tablet body ───────────────────────────────────────────────────────
        tabletBody: {
          flex: 1,
          flexDirection: 'row',
        },
        // ── Year grid (left column) ───────────────────────────────────────────
        yearGridCol: {
          flex: 1,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          backgroundColor: colors.background,
        },
        yearGridContent: {
          padding: 12,
        },
        yearGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        yearTile: {
          // flexBasis 30% + flexGrow: 3 items fill the row, 4th wraps
          flexBasis: '30%',
          flexGrow: 1,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 8,
          alignItems: 'center',
        },
        yearTileSelected: {
          borderColor: colors.accent,
          backgroundColor: colors.accentSoft,
        },
        yearTileYear: {
          ...Type.display,
          fontSize: 26,
          letterSpacing: -1,
          color: colors.textDisabled,
          lineHeight: 30,
        },
        yearTileYearSelected: {
          color: colors.accent,
        },
        yearTileCount: {
          ...Type.label,
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 3,
        },
        yearTileCountSelected: {
          color: colors.accent,
          opacity: 0.75,
        },
        // ── Detail panel (right column) ───────────────────────────────────────
        detailPanel: {
          flex: 2,
          backgroundColor: colors.surface,
        },
        detailPanelContent: {
          padding: 16,
        },
        // Year row: large heading + "Also On This Day" card inline
        detailYearRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 12,
          marginBottom: 12,
        },
        detailYearHeading: {
          ...Type.display,
          fontSize: 52,
          letterSpacing: -2,
          color: colors.textPrimary,
          lineHeight: 54,
        },
        // Also On This Day — same compact style as header OTD
        alsoOnThisDayCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.accent,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginBottom: 4,
        },
        alsoOtdLabel: {
          ...Type.label,
          fontSize: 9,
          color: colors.accent,
          letterSpacing: 0.8,
          marginBottom: 1,
        },
        alsoOtdName: {
          ...Type.body,
          fontWeight: '600',
          color: colors.textPrimary,
          fontSize: 12,
        },
        alsoOtdMeta: {
          ...Type.label,
          fontSize: 10,
          color: colors.textSecondary,
        },
        // 4-stat row
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
        // Charts row
        detailChartsRow: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 14,
        },
        detailChartBox: {
          flex: 1,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 10,
        },
        detailChartLabel: {
          ...Type.label,
          fontSize: 10,
          color: colors.textMuted,
          letterSpacing: 0.8,
          marginBottom: 6,
        },
        // Highlights
        detailHighlightsLabel: {
          ...Type.label,
          color: colors.textMuted,
          letterSpacing: 1,
          marginBottom: 8,
        },
        detailHighlightEntry: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
          paddingHorizontal: 10,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          marginBottom: 6,
        },
        detailHighlightText: {
          flex: 1,
        },
        detailMilestoneTag: {
          ...Type.label,
          color: colors.accent,
          letterSpacing: 0.8,
          marginBottom: 1,
        },
        detailArtistName: {
          ...Type.title,
          color: colors.textPrimary,
        },
        detailMeta: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 1,
        },
        detailChevron: {
          ...Type.body,
          color: colors.textDisabled,
        },
        // ── Year chapter (phone / phone-like) ─────────────────────────────────
        yearChapter: {
          marginTop: 28,
          marginHorizontal: 20,
          marginBottom: 8,
        },
        yearGhost: {
          ...Type.display,
          fontSize: 64,
          lineHeight: 68,
          color: colors.textPrimary,
          opacity: 0.18,
        },
        yearMeta: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 2,
        },
        yearStatRow: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 4,
          flexWrap: 'wrap',
        },
        yearStatChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        yearStatValue: {
          ...Type.label,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        yearStatLabel: {
          ...Type.label,
          color: colors.textMuted,
        },
        monthGrid: {
          flexDirection: 'row',
          marginTop: 6,
          marginBottom: 4,
          gap: 4,
        },
        monthCell: {
          alignItems: 'center',
          flex: 1,
        },
        monthLabel: {
          ...Type.label,
          fontSize: 8,
          color: colors.textDisabled,
          marginBottom: 3,
        },
        monthDotEmpty: {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: colors.border,
        },
        monthDotFull: {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: colors.accent,
          opacity: 0.45,
        },
        monthDotPeak: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.accent,
        },
        // ── Timeline spine ────────────────────────────────────────────────────
        spineContainer: {
          borderLeftWidth: 1.5,
          borderLeftColor: colors.spineColor,
          marginLeft: 36,
          paddingLeft: 20,
          marginBottom: 4,
        },
        concertEntry: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
        },
        dotWrapper: {
          position: 'absolute',
          left: -25,
          top: 14,
        },
        dotActive: {
          width: 9,
          height: 9,
          borderRadius: 4.5,
          backgroundColor: colors.dotActive,
          borderWidth: 2,
          borderColor: colors.background,
        },
        dotInactive: {
          width: 9,
          height: 9,
          borderRadius: 4.5,
          backgroundColor: colors.dotInactive,
          borderWidth: 2,
          borderColor: colors.background,
        },
        entryContent: {
          flex: 1,
        },
        entryDate: {
          ...Type.label,
          color: colors.accent,
          letterSpacing: 0.8,
          marginBottom: 2,
        },
        entryArtist: {
          ...Type.title,
          color: colors.textPrimary,
        },
        entryVenue: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 1,
        },
        entryChevron: {
          ...Type.body,
          color: colors.textDisabled,
          marginLeft: 8,
        },
        entryImageWrapper: {
          marginRight: 10,
        },
        milestoneMarker: {
          width: 9,
          height: 9,
          borderRadius: 2,
          backgroundColor: colors.accent,
          transform: [{ rotate: '45deg' }],
        },
        milestoneTag: {
          ...Type.label,
          color: colors.accent,
          letterSpacing: 0.8,
          marginBottom: 1,
        },
        // ── On this day (phone) ───────────────────────────────────────────────
        onThisDayCard: {
          marginHorizontal: 20,
          marginTop: 16,
          marginBottom: 4,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.accent,
          borderRadius: 12,
          padding: 14,
        },
        onThisDayLabel: {
          ...Type.label,
          color: colors.accent,
          letterSpacing: 0.8,
          marginBottom: 6,
        },
        onThisDayRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        onThisDayArtist: {
          ...Type.title,
          color: colors.textPrimary,
          flex: 1,
        },
        onThisDayMeta: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 3,
        },
        onThisDayChevron: {
          ...Type.body,
          color: colors.accent,
          marginLeft: 8,
        },
      }),
    [colors],
  );

  const { lastSyncTimestamp, notifySyncComplete } = useSyncContext();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [monthlyData, setMonthlyData] = useState<{ year: string; month: number; count: number }[]>(
    [],
  );
  const [yearSummaries, setYearSummaries] = useState<
    {
      year: string;
      shows: number;
      countries: number;
      cities: number;
      peakMonth: number;
      peakMonthCount: number;
    }[]
  >([]);
  const [insightStats, setInsightStats] = useState<Awaited<
    ReturnType<typeof dbOperations.getInsightStats>
  > | null>(null);
  const [onThisDay, setOnThisDay] = useState<OnThisDayConcert>(null);
  const [panelOnThisDay, setPanelOnThisDay] = useState<OnThisDayConcert>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const stored = await getStoredUsername();
      if (stored) setUsername(stored);
      await loadDashboard();
    };
    init();
  }, [lastSyncTimestamp]);

  // Load panel OTD whenever selected year changes (tablet only)
  useEffect(() => {
    if (!isTablet || !selectedYear) return;
    dbOperations.getOnThisDayConcertForYear(selectedYear).then(setPanelOnThisDay);
  }, [selectedYear, isTablet]);

  const loadDashboard = async () => {
    try {
      const [dashStats, fetchedAt, onThisDayResult, monthly, summaries, insights] =
        await Promise.all([
          dbOperations.getDashboardStats(),
          dbOperations.getLastFetchedAt(),
          dbOperations.getOnThisDayConcert(),
          dbOperations.getConcertsByYearMonth(),
          dbOperations.getYearSummaries(),
          dbOperations.getInsightStats(),
        ]);
      setStats(dashStats);
      setMonthlyData(monthly);
      setYearSummaries(summaries);
      setOnThisDay(onThisDayResult);
      setInsightStats(insights);
      setLastSynced(fetchedAt ? fetchedAt.toLocaleString() : null);
      // Default to the most recent year on first load
      const sorted = [...dashStats.concertsByYear].sort(
        (a, b) => Number(b.year) - Number(a.year),
      );
      setSelectedYear((prev) => prev ?? sorted[0]?.year ?? null);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      Alert.alert(t('dashboard.usernameRequired'), t('dashboard.usernameRequiredMessage'));
      return;
    }
    await setStoredUsername(trimmed);
    const result = await syncConcertData(trimmed);
    if (result.success) {
      notifySyncComplete();
      await loadDashboard();
      if (result.newConcerts > 0) {
        Alert.alert(
          t('dashboard.syncComplete'),
          t('dashboard.syncCompleteMessage', { count: result.newConcerts }),
        );
      } else if (result.pagesProcessed > 0) {
        Alert.alert(t('dashboard.upToDate'), t('dashboard.upToDateMessage'));
      }
    } else {
      Alert.alert(t('dashboard.syncFailed'), result.error ?? 'Unknown error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleSync();
    setRefreshing(false);
  };

  const selectYear = useCallback((year: string) => {
    setSelectedYear(year);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // No concerts synced yet
  if (stats.totalConcerts === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="dashboard-screen"
      >
        <View style={styles.topBar}>
          <View style={styles.topBarRow}>
            <Text style={styles.appTitle}>Chronicles</Text>
            <View style={styles.topBarActions}>
              <TouchableOpacity
                onPress={handleSync}
                accessibilityRole="button"
                accessibilityLabel="Sync concert data"
              >
                <Icon
                  sf="arrow.clockwise"
                  md="refresh-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(home)/settings')}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Icon sf="gearshape" md="settings-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <EmptyState
          icon={{ sf: 'music.note', md: 'musical-note-outline' }}
          title={t('dashboard.emptyTitle')}
          body={t('dashboard.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  const MONTH_ABBR = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // Build lookups
  const monthlyByYear = monthlyData.reduce<Record<string, Record<number, number>>>((acc, row) => {
    if (!acc[row.year]) acc[row.year] = {};
    acc[row.year][row.month] = row.count;
    return acc;
  }, {});

  const summaryByYear = yearSummaries.reduce<Record<string, (typeof yearSummaries)[0]>>(
    (acc, s) => {
      acc[s.year] = s;
      return acc;
    },
    {},
  );

  const currentYear = String(new Date().getFullYear());

  const lastConcertYear = stats.lastConcert ? stats.lastConcert.eventDate.split('-')[2] : null;
  const firstConcertYear = stats.firstConcert ? stats.firstConcert.eventDate.split('-')[2] : null;
  const onThisDayYear = onThisDay ? onThisDay.eventDate.split('-')[2] : null;

  type Milestone = NonNullable<typeof insightStats>['milestones'][number];
  const milestonesByYear = (insightStats?.milestones ?? []).reduce<Record<string, Milestone[]>>(
    (acc, m) => {
      const yr = m.eventDate.split('-')[2];
      if (yr) {
        if (!acc[yr]) acc[yr] = [];
        acc[yr].push(m);
      }
      return acc;
    },
    {},
  );

  const yearsSorted = [...stats.concertsByYear].sort((a, b) => Number(b.year) - Number(a.year));

  // ── Phone: shared JSX ──────────────────────────────────────────────────────

  const onThisDayCardJSX = onThisDay ? (
    <TouchableOpacity
      style={styles.onThisDayCard}
      onPress={() =>
        router.push({ pathname: '/(home)/concert/[id]', params: { id: onThisDay.setlistId } })
      }
      accessibilityRole="button"
      accessibilityLabel={`On this day ${onThisDay.yearsAgo} years ago: ${onThisDay.artistName}`}
      accessibilityHint={t('Opens concert details')}
    >
      <Text style={styles.onThisDayLabel}>
        {`ON THIS DAY · ${onThisDay.yearsAgo} YEAR${onThisDay.yearsAgo !== 1 ? 'S' : ''} AGO`}
      </Text>
      <View style={styles.onThisDayRow}>
        {onThisDay.artistMbid && (
          <View style={styles.entryImageWrapper}>
            <ArtistImage
              mbid={onThisDay.artistMbid}
              imageUrl={onThisDay.artistImageUrl}
              size={44}
              name={onThisDay.artistName}
            />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.onThisDayArtist}>{onThisDay.artistName}</Text>
          <Text style={styles.onThisDayMeta}>
            {onThisDay.venueName} · {formatDate(onThisDay.eventDate)}
          </Text>
        </View>
        <Text style={styles.onThisDayChevron}>›</Text>
      </View>
    </TouchableOpacity>
  ) : null;

  const timelineContent = yearsSorted.map((yearItem, yearIndex) => {
    const yearStr = String(yearItem.year);
    const showsInYear = yearItem.count;
    const summary = summaryByYear[yearStr];
    const isPastYear = yearStr !== currentYear;
    const isLastConcertYear = lastConcertYear === yearStr;
    const isFirstConcertYear = firstConcertYear === yearStr;
    const isOnThisDayYear = onThisDayYear === yearStr;
    const alreadyShownIds = new Set([
      isLastConcertYear ? stats.lastConcert?.setlistId : undefined,
      isFirstConcertYear ? stats.firstConcert?.setlistId : undefined,
      isOnThisDayYear ? onThisDay?.setlistId : undefined,
    ]);
    const milestonesInYear = (milestonesByYear[yearStr] ?? []).filter(
      (m) => !alreadyShownIds.has(m.setlistId),
    );

    return (
      <View key={yearStr}>
        <View style={styles.yearChapter}>
          <Text style={styles.yearGhost}>{yearStr}</Text>
          <Text
            style={styles.yearMeta}
          >{`${showsInYear} show${showsInYear !== 1 ? 's' : ''}`}</Text>
          {isPastYear && summary && (summary.countries > 1 || summary.cities > 1) && (
            <View style={styles.yearStatRow}>
              {summary.countries > 1 && (
                <View style={styles.yearStatChip}>
                  <Text style={styles.yearStatValue}>{summary.countries}</Text>
                  <Text style={styles.yearStatLabel}>
                    {summary.countries === 1 ? 'country' : 'countries'}
                  </Text>
                </View>
              )}
              {summary.cities > 1 && (
                <View style={styles.yearStatChip}>
                  <Text style={styles.yearStatValue}>{summary.cities}</Text>
                  <Text style={styles.yearStatLabel}>
                    {summary.cities === 1 ? 'city' : 'cities'}
                  </Text>
                </View>
              )}
              {summary.peakMonth > 0 && summary.peakMonthCount > 1 && (
                <View style={styles.yearStatChip}>
                  <Text style={styles.yearStatLabel}>peak</Text>
                  <Text style={styles.yearStatValue}>{MONTH_NAMES[summary.peakMonth - 1]}</Text>
                  <Text style={styles.yearStatLabel}>({summary.peakMonthCount})</Text>
                </View>
              )}
            </View>
          )}
          {monthlyByYear[yearStr] && (
            <View style={styles.monthGrid}>
              {MONTH_ABBR.map((abbr, idx) => {
                const month = idx + 1;
                const count = monthlyByYear[yearStr]?.[month] ?? 0;
                const yearMonths = monthlyByYear[yearStr] ?? {};
                const peak = Math.max(...Object.values(yearMonths), 0);
                const isPeak = count > 0 && count === peak;
                return (
                  <View key={month} style={styles.monthCell}>
                    <Text style={styles.monthLabel}>{abbr}</Text>
                    <View
                      style={
                        count === 0
                          ? styles.monthDotEmpty
                          : isPeak
                            ? styles.monthDotPeak
                            : styles.monthDotFull
                      }
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {(isLastConcertYear ||
          isOnThisDayYear ||
          isFirstConcertYear ||
          milestonesInYear.length > 0) && (
          <View style={styles.spineContainer}>
            {isLastConcertYear && stats.lastConcert && (
              <TouchableOpacity
                style={styles.concertEntry}
                onPress={() =>
                  router.push({
                    pathname: '/(home)/concert/[id]',
                    params: { id: stats.lastConcert?.setlistId },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${t('dashboard.mostRecent')}, ${stats.lastConcert.artistName}, ${formatDate(stats.lastConcert.eventDate)}`}
                accessibilityHint={t('Opens concert details')}
              >
                <View style={styles.dotWrapper}>
                  <View style={yearIndex === 0 ? styles.dotActive : styles.dotInactive} />
                </View>
                {stats.lastConcert.artistMbid && (
                  <View style={styles.entryImageWrapper}>
                    <ArtistImage
                      mbid={stats.lastConcert.artistMbid}
                      imageUrl={stats.lastConcert.artistImageUrl}
                      size={32}
                      name={stats.lastConcert.artistName}
                    />
                  </View>
                )}
                <View style={styles.entryContent}>
                  <Text style={styles.entryDate}>{formatDate(stats.lastConcert.eventDate)}</Text>
                  <Text style={styles.entryArtist}>{stats.lastConcert.artistName}</Text>
                </View>
                <Text style={styles.entryChevron}>›</Text>
              </TouchableOpacity>
            )}

            {milestonesInYear.map((m) => {
              const n = m.number;
              const suffix = n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH';
              const label = `${n}${suffix} SHOW`;
              return (
                <TouchableOpacity
                  key={m.number}
                  style={styles.concertEntry}
                  onPress={() =>
                    router.push({
                      pathname: '/(home)/concert/[id]',
                      params: { id: m.setlistId },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${label}: ${m.artistName}, ${formatDate(m.eventDate)}`}
                  accessibilityHint={t('Opens concert details')}
                >
                  <View style={styles.dotWrapper}>
                    <View style={styles.milestoneMarker} />
                  </View>
                  <View style={styles.entryContent}>
                    <Text style={styles.milestoneTag}>{label}</Text>
                    <Text style={styles.entryArtist}>{m.artistName}</Text>
                    {m.cityName ? (
                      <Text style={styles.entryVenue}>
                        {m.cityName} · {formatDate(m.eventDate)}
                      </Text>
                    ) : (
                      <Text style={styles.entryVenue}>{formatDate(m.eventDate)}</Text>
                    )}
                  </View>
                  <Text style={styles.entryChevron}>›</Text>
                </TouchableOpacity>
              );
            })}

            {isOnThisDayYear && onThisDay && (
              <TouchableOpacity
                style={styles.concertEntry}
                onPress={() =>
                  router.push({
                    pathname: '/(home)/concert/[id]',
                    params: { id: onThisDay.setlistId },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${t('dashboard.yearsAgo', { count: onThisDay.yearsAgo })}, ${onThisDay.artistName}, ${formatDate(onThisDay.eventDate)}`}
                accessibilityHint={t('Opens concert details')}
              >
                <View style={styles.dotWrapper}>
                  <View style={styles.dotInactive} />
                </View>
                {onThisDay.artistMbid && (
                  <View style={styles.entryImageWrapper}>
                    <ArtistImage
                      mbid={onThisDay.artistMbid}
                      imageUrl={onThisDay.artistImageUrl}
                      size={32}
                      name={onThisDay.artistName}
                    />
                  </View>
                )}
                <View style={styles.entryContent}>
                  <Text style={styles.entryDate}>{formatDate(onThisDay.eventDate)}</Text>
                  <Text style={styles.entryArtist}>{onThisDay.artistName}</Text>
                  <Text style={styles.entryVenue}>{onThisDay.venueName}</Text>
                </View>
                <Text style={styles.entryChevron}>›</Text>
              </TouchableOpacity>
            )}

            {isFirstConcertYear && stats.firstConcert && (
              <TouchableOpacity
                style={styles.concertEntry}
                onPress={() =>
                  router.push({
                    pathname: '/(home)/concert/[id]',
                    params: { id: stats.firstConcert?.setlistId },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${t('dashboard.firstConcert')}, ${stats.firstConcert.artistName}, ${formatDate(stats.firstConcert.eventDate)}`}
                accessibilityHint={t('Opens concert details')}
              >
                <View style={styles.dotWrapper}>
                  <View style={styles.dotInactive} />
                </View>
                {stats.firstConcert.artistMbid && (
                  <View style={styles.entryImageWrapper}>
                    <ArtistImage
                      mbid={stats.firstConcert.artistMbid}
                      imageUrl={stats.firstConcert.artistImageUrl}
                      size={32}
                      name={stats.firstConcert.artistName}
                    />
                  </View>
                )}
                <View style={styles.entryContent}>
                  <Text style={styles.entryDate}>{formatDate(stats.firstConcert.eventDate)}</Text>
                  <Text style={styles.entryArtist}>{stats.firstConcert.artistName}</Text>
                </View>
                <Text style={styles.entryChevron}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  });

  // ── Tablet: derived data for selected year ─────────────────────────────────

  const selectedYearStr = selectedYear ?? yearsSorted[0]?.year?.toString() ?? '';
  const selectedSummary = summaryByYear[selectedYearStr];
  const selectedShowCount =
    stats.concertsByYear.find((y) => y.year === selectedYearStr)?.count ?? 0;
  const selectedMonthlyMap = monthlyByYear[selectedYearStr] ?? {};
  const monthlyChartData = MONTH_ABBR.map((label, i) => ({
    label,
    value: selectedMonthlyMap[i + 1] ?? 0,
  }));
  const yoyChartData = [...stats.concertsByYear]
    .sort((a, b) => Number(a.year) - Number(b.year))
    .map((y) => ({ label: String(y.year).slice(2), value: y.count }));

  const isSelectedLastYear = lastConcertYear === selectedYearStr;
  const isSelectedFirstYear = firstConcertYear === selectedYearStr;
  const isSelectedOnThisDayYear = onThisDayYear === selectedYearStr;
  const selectedAlreadyShown = new Set([
    isSelectedLastYear ? stats.lastConcert?.setlistId : undefined,
    isSelectedFirstYear ? stats.firstConcert?.setlistId : undefined,
    isSelectedOnThisDayYear ? onThisDay?.setlistId : undefined,
  ]);
  const selectedMilestones = (milestonesByYear[selectedYearStr] ?? []).filter(
    (m) => !selectedAlreadyShown.has(m.setlistId),
  );

  // Show "Also On This Day" only if it's a different concert from the header OTD
  const showAlsoOnThisDay =
    panelOnThisDay !== null && panelOnThisDay.setlistId !== onThisDay?.setlistId;

  // ── Tablet: detail panel ───────────────────────────────────────────────────

  const tabletDetailPanel = (
    <ScrollView style={styles.detailPanel}>
      <View style={styles.detailPanelContent}>
        {/* Year heading + Also On This Day inline */}
        <View style={styles.detailYearRow}>
          <Text style={styles.detailYearHeading}>{selectedYearStr}</Text>
          {showAlsoOnThisDay && panelOnThisDay && (
            <TouchableOpacity
              style={styles.alsoOnThisDayCard}
              onPress={() =>
                router.push({
                  pathname: '/(home)/concert/[id]',
                  params: { id: panelOnThisDay.setlistId },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Also on this day ${panelOnThisDay.yearsAgo} years ago: ${panelOnThisDay.artistName}`}
            >
              {panelOnThisDay.artistMbid && (
                <ArtistImage
                  mbid={panelOnThisDay.artistMbid}
                  imageUrl={panelOnThisDay.artistImageUrl}
                  size={26}
                  name={panelOnThisDay.artistName}
                />
              )}
              <View>
                <Text style={styles.alsoOtdLabel}>ALSO ON THIS DAY</Text>
                <Text style={styles.alsoOtdName}>{panelOnThisDay.artistName}</Text>
                <Text style={styles.alsoOtdMeta}>{panelOnThisDay.venueName}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 4-stat row */}
        <View style={styles.detailStatRow}>
          <View style={styles.detailStatCard}>
            <Text style={[styles.detailStatValue, { color: colors.accent }]}>
              {selectedShowCount}
            </Text>
            <Text style={styles.detailStatLabel}>shows</Text>
          </View>
          <View style={styles.detailStatCard}>
            <Text style={[styles.detailStatValue, { color: colors.chartGreen }]}>
              {selectedSummary?.countries ?? '—'}
            </Text>
            <Text style={styles.detailStatLabel}>
              {(selectedSummary?.countries ?? 0) === 1 ? 'country' : 'countries'}
            </Text>
          </View>
          <View style={styles.detailStatCard}>
            <Text style={[styles.detailStatValue, { color: colors.chartOrange }]}>
              {selectedSummary?.cities ?? '—'}
            </Text>
            <Text style={styles.detailStatLabel}>
              {(selectedSummary?.cities ?? 0) === 1 ? 'city' : 'cities'}
            </Text>
          </View>
          <View style={styles.detailStatCard}>
            <Text style={[styles.detailStatValue, { color: colors.chartPurple }]}>
              {selectedSummary?.peakMonthCount ?? '—'}
            </Text>
            <Text style={styles.detailStatLabel}>
              {selectedSummary ? `peak ${MONTH_NAMES[selectedSummary.peakMonth - 1]}` : 'peak'}
            </Text>
          </View>
        </View>

        {/* Charts row */}
        <View style={styles.detailChartsRow}>
          <View style={styles.detailChartBox}>
            <Text style={styles.detailChartLabel}>MONTHLY</Text>
            <BarChart data={monthlyChartData} height={90} showLabels />
          </View>
          <View style={styles.detailChartBox}>
            <Text style={styles.detailChartLabel}>YEAR OVER YEAR</Text>
            <BarChart data={yoyChartData} color={colors.chartPurple} height={90} showLabels />
          </View>
        </View>

        {/* Concert highlights */}
        {(isSelectedLastYear ||
          isSelectedOnThisDayYear ||
          isSelectedFirstYear ||
          selectedMilestones.length > 0) && (
          <>
            <Text style={styles.detailHighlightsLabel}>HIGHLIGHTS</Text>

            {isSelectedLastYear && stats.lastConcert && (
              <TouchableOpacity
                style={styles.detailHighlightEntry}
                onPress={() =>
                  router.push({
                    pathname: '/(home)/concert/[id]',
                    params: { id: stats.lastConcert?.setlistId },
                  })
                }
                accessibilityRole="button"
              >
                {stats.lastConcert.artistMbid && (
                  <ArtistImage
                    mbid={stats.lastConcert.artistMbid}
                    imageUrl={stats.lastConcert.artistImageUrl}
                    size={32}
                    name={stats.lastConcert.artistName}
                  />
                )}
                <View style={styles.detailHighlightText}>
                  <Text style={styles.detailArtistName}>{stats.lastConcert.artistName}</Text>
                  <Text style={styles.detailMeta}>{formatDate(stats.lastConcert.eventDate)}</Text>
                </View>
                <Text style={styles.detailChevron}>›</Text>
              </TouchableOpacity>
            )}

            {selectedMilestones.map((m) => {
              const n = m.number;
              const suffix = n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH';
              return (
                <TouchableOpacity
                  key={m.number}
                  style={styles.detailHighlightEntry}
                  onPress={() =>
                    router.push({
                      pathname: '/(home)/concert/[id]',
                      params: { id: m.setlistId },
                    })
                  }
                  accessibilityRole="button"
                >
                  <View style={styles.detailHighlightText}>
                    <Text style={styles.detailMilestoneTag}>{`${n}${suffix} SHOW`}</Text>
                    <Text style={styles.detailArtistName}>{m.artistName}</Text>
                    <Text style={styles.detailMeta}>
                      {m.cityName ? `${m.cityName} · ` : ''}
                      {formatDate(m.eventDate)}
                    </Text>
                  </View>
                  <Text style={styles.detailChevron}>›</Text>
                </TouchableOpacity>
              );
            })}

            {isSelectedOnThisDayYear && onThisDay && (
              <TouchableOpacity
                style={styles.detailHighlightEntry}
                onPress={() =>
                  router.push({
                    pathname: '/(home)/concert/[id]',
                    params: { id: onThisDay.setlistId },
                  })
                }
                accessibilityRole="button"
              >
                {onThisDay.artistMbid && (
                  <ArtistImage
                    mbid={onThisDay.artistMbid}
                    imageUrl={onThisDay.artistImageUrl}
                    size={32}
                    name={onThisDay.artistName}
                  />
                )}
                <View style={styles.detailHighlightText}>
                  <Text style={styles.detailArtistName}>{onThisDay.artistName}</Text>
                  <Text style={styles.detailMeta}>
                    {onThisDay.venueName} · {formatDate(onThisDay.eventDate)}
                  </Text>
                </View>
                <Text style={styles.detailChevron}>›</Text>
              </TouchableOpacity>
            )}

            {isSelectedFirstYear && stats.firstConcert && (
              <TouchableOpacity
                style={styles.detailHighlightEntry}
                onPress={() =>
                  router.push({
                    pathname: '/(home)/concert/[id]',
                    params: { id: stats.firstConcert?.setlistId },
                  })
                }
                accessibilityRole="button"
              >
                {stats.firstConcert.artistMbid && (
                  <ArtistImage
                    mbid={stats.firstConcert.artistMbid}
                    imageUrl={stats.firstConcert.artistImageUrl}
                    size={32}
                    name={stats.firstConcert.artistName}
                  />
                )}
                <View style={styles.detailHighlightText}>
                  <Text style={styles.detailArtistName}>{stats.firstConcert.artistName}</Text>
                  <Text style={styles.detailMeta}>{formatDate(stats.firstConcert.eventDate)}</Text>
                </View>
                <Text style={styles.detailChevron}>›</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="dashboard-screen"
    >
      {isTablet ? (
        /* ── Tablet layout ──────────────────────────────────────────────────── */
        <>
          {/* Two-section top bar */}
          <View style={styles.tabletTopBar}>
            <View style={styles.tabletTopBarLeft}>
              <Text style={styles.appTitle}>Chronicles</Text>
              <Text style={styles.statsLine}>
                {`${stats.totalConcerts} shows · ${stats.totalArtists} artists · ${stats.totalCountries} countries`}
              </Text>
            </View>
            <View style={styles.tabletTopBarRight}>
              {onThisDay && (
                <TouchableOpacity
                  style={styles.headerOtdCard}
                  onPress={() =>
                    router.push({
                      pathname: '/(home)/concert/[id]',
                      params: { id: onThisDay.setlistId },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`On this day ${onThisDay.yearsAgo} years ago: ${onThisDay.artistName}`}
                >
                  {onThisDay.artistMbid && (
                    <ArtistImage
                      mbid={onThisDay.artistMbid}
                      imageUrl={onThisDay.artistImageUrl}
                      size={26}
                      name={onThisDay.artistName}
                    />
                  )}
                  <View>
                    <Text style={styles.headerOtdLabel}>
                      {`ON THIS DAY · ${onThisDay.yearsAgo} YR${onThisDay.yearsAgo !== 1 ? 'S' : ''} AGO`}
                    </Text>
                    <Text style={styles.headerOtdName}>{onThisDay.artistName}</Text>
                    <Text style={styles.headerOtdMeta}>
                      {onThisDay.venueName} · {formatDate(onThisDay.eventDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              <View style={[styles.topBarActions, { marginLeft: 'auto' }]}>
                <TouchableOpacity
                  onPress={handleSync}
                  accessibilityRole="button"
                  accessibilityLabel="Sync concert data"
                >
                  <Icon
                    sf="arrow.clockwise"
                    md="refresh-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(home)/settings')}
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                >
                  <Icon
                    sf="gearshape"
                    md="settings-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Two-column body */}
          <View style={styles.tabletBody}>
            {/* Left: year grid */}
            <ScrollView
              style={styles.yearGridCol}
              contentContainerStyle={styles.yearGridContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <View style={styles.yearGrid}>
                {yearsSorted.map((y) => {
                  const yr = String(y.year);
                  const isSelected = yr === selectedYearStr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.yearTile, isSelected && styles.yearTileSelected]}
                      onPress={() => selectYear(yr)}
                      accessibilityRole="button"
                      accessibilityLabel={`${yr}, ${y.count} shows`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[styles.yearTileYear, isSelected && styles.yearTileYearSelected]}
                      >
                        {yr}
                      </Text>
                      <Text
                        style={[
                          styles.yearTileCount,
                          isSelected && styles.yearTileCountSelected,
                        ]}
                      >
                        {`${y.count} show${y.count !== 1 ? 's' : ''}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Right: year detail panel */}
            {tabletDetailPanel}
          </View>
        </>
      ) : (
        /* ── Phone layout ────────────────────────────────────────────────────── */
        <>
          <View style={styles.topBar}>
            <View style={styles.topBarRow}>
              <Text style={styles.appTitle}>Chronicles</Text>
              <View style={styles.topBarActions}>
                <TouchableOpacity
                  onPress={handleSync}
                  accessibilityRole="button"
                  accessibilityLabel="Sync concert data"
                >
                  <Icon
                    sf="arrow.clockwise"
                    md="refresh-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(home)/settings')}
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                >
                  <Icon
                    sf="gearshape"
                    md="settings-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.statsLine}>
              {`${stats.totalConcerts} shows · ${stats.totalArtists} artists · ${stats.totalCountries} countries`}
            </Text>
            {lastSynced && (
              <Text style={styles.lastSynced}>
                {t('dashboard.lastSynced', { date: lastSynced })}
              </Text>
            )}
          </View>
          <TabScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {onThisDayCardJSX}
            {insightStats && <InsightCards stats={insightStats} />}
            {timelineContent}
          </TabScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
