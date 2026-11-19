import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import { syncConcertData, getStoredUsername, setStoredUsername } from '@/services/syncService';
import { useChronicleColors } from '@/utils/colors';
import { useSyncContext } from '@/contexts/SyncContext';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import InsightCards from '@/components/InsightCards';
import { TabScrollView, EmptyState } from '@/components/ui';
import { useTabletLayout } from '@/utils/tablet';
import OnThisDayCard from '@/components/dashboard/OnThisDayCard';
import PhoneTopBar from '@/components/dashboard/PhoneTopBar';
import TabletDetailPanel from '@/components/dashboard/TabletDetailPanel';
import TabletTopBar from '@/components/dashboard/TabletTopBar';
import TabletYearGrid from '@/components/dashboard/TabletYearGrid';
import { YearTimeline } from '@/components/dashboard/YearSection';
import {
  groupMilestonesByYear,
  groupMonthlyByYear,
  indexSummariesByYear,
} from '@/components/dashboard/yearData';
import type {
  DashboardStats,
  InsightStats,
  MonthlyRow,
  OnThisDayConcert,
  YearConcerts,
  YearSummary,
} from '@/components/dashboard/types';

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
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const { isTablet } = useTabletLayout();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabletBody: {
      flex: 1,
      flexDirection: 'row',
    },
  });

  const { lastSyncTimestamp, notifySyncComplete } = useSyncContext();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [yearSummaries, setYearSummaries] = useState<YearSummary[]>([]);
  const [insightStats, setInsightStats] = useState<InsightStats | null>(null);
  const [onThisDay, setOnThisDay] = useState<OnThisDayConcert>(null);
  const [panelOnThisDay, setPanelOnThisDay] = useState<OnThisDayConcert>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const usernameRef = useRef('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  // `isCancelled` lets an effect drop a stale result once its cleanup has run.
  const loadDashboard = async (isCancelled: () => boolean = () => false) => {
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
      if (isCancelled()) return;
      setStats(dashStats);
      setMonthlyData(monthly);
      setYearSummaries(summaries);
      setOnThisDay(onThisDayResult);
      setInsightStats(insights);
      setLastSynced(fetchedAt ? fetchedAt.toLocaleString() : null);
      // Default to the most recent year on first load
      const sorted = [...dashStats.concertsByYear].sort((a, b) => Number(b.year) - Number(a.year));
      setSelectedYear((prev) => prev ?? sorted[0]?.year ?? null);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      if (!isCancelled()) setLoading(false);
    }
  };

  // react-doctor-disable-next-line react-doctor/no-set-state-after-await-in-effect -- loadDashboard checks isCancelled() before every state update
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const stored = await getStoredUsername();
      if (cancelled) return;
      if (stored) usernameRef.current = stored;
      await loadDashboard(() => cancelled);
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [lastSyncTimestamp]);

  const [yearConcerts, setYearConcerts] = useState<YearConcerts>([]);

  // Load panel OTD and year concerts whenever selected year changes (tablet only)
  useEffect(() => {
    if (!isTablet || !selectedYear) return;
    let cancelled = false;
    void dbOperations.getOnThisDayConcertForYear(selectedYear).then((concert) => {
      if (!cancelled) setPanelOnThisDay(concert);
    });
    void dbOperations.getSetlistsByYear(selectedYear).then((concerts) => {
      if (!cancelled) setYearConcerts(concerts);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedYear, isTablet]);

  const handleSync = async () => {
    const trimmed = usernameRef.current.trim();
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
      Alert.alert(t('dashboard.syncFailed'), result.error ?? t('common.unknownError'));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // No try/finally: the React Compiler cannot compile it, so reset on both paths.
    try {
      await handleSync();
    } catch (error) {
      setRefreshing(false);
      throw error;
    }
    setRefreshing(false);
  };

  const selectYear = (year: string) => {
    setSelectedYear(year);
  };

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
        <PhoneTopBar onSync={handleSync} />
        <EmptyState
          icon={{ sf: 'music.note', md: 'musical-note-outline' }}
          title={t('dashboard.emptyTitle')}
          body={t('dashboard.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  const monthlyByYear = groupMonthlyByYear(monthlyData);
  const summaryByYear = indexSummariesByYear(yearSummaries);
  const milestonesByYear = groupMilestonesByYear(insightStats?.milestones ?? []);
  const yearsSorted = [...stats.concertsByYear].sort((a, b) => Number(b.year) - Number(a.year));
  const totals = {
    concerts: stats.totalConcerts,
    artists: stats.totalArtists,
    countries: stats.totalCountries,
  };
  const selectedYearStr = selectedYear ?? yearsSorted[0]?.year?.toString() ?? '';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="dashboard-screen"
    >
      {isTablet ? (
        <>
          <TabletTopBar totals={totals} onThisDay={onThisDay} onSync={handleSync} />
          <View style={styles.tabletBody}>
            <TabletYearGrid
              years={yearsSorted}
              selectedYear={selectedYearStr}
              onSelectYear={selectYear}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
            <TabletDetailPanel
              yearStr={selectedYearStr}
              stats={stats}
              onThisDay={onThisDay}
              panelOnThisDay={panelOnThisDay}
              yearConcerts={yearConcerts}
              summary={summaryByYear[selectedYearStr]}
              monthly={monthlyByYear[selectedYearStr]}
              yearMilestones={milestonesByYear[selectedYearStr] ?? []}
            />
          </View>
        </>
      ) : (
        <>
          <PhoneTopBar onSync={handleSync} totals={totals} lastSynced={lastSynced} />
          <TabScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {onThisDay && <OnThisDayCard onThisDay={onThisDay} />}
            {insightStats && <InsightCards stats={insightStats} />}
            <YearTimeline
              stats={stats}
              onThisDay={onThisDay}
              yearsSorted={yearsSorted}
              summaryByYear={summaryByYear}
              monthlyByYear={monthlyByYear}
              milestonesByYear={milestonesByYear}
            />
          </TabScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
