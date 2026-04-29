import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '../../../src/database/operations';
import {
  syncConcertData,
  getStoredUsername,
  setStoredUsername,
} from '../../../src/services/syncService';
import { formatDate } from '../../../src/utils/date';
import { useChronicleColors } from '../../../src/utils/colors';
import { Type } from '../../../src/utils/typography';
import { useSyncContext } from '../../../src/contexts/SyncContext';
import DashboardSkeleton from '../../../src/components/skeletons/DashboardSkeleton';
import { TabScrollView } from '../../../src/components/ui';

type DashboardStats = Awaited<ReturnType<typeof dbOperations.getDashboardStats>>;

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
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        // ── Top bar ──────────────────────────────────────────────────────────
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
        topBarIcon: {
          ...Type.body,
          color: colors.textMuted,
          fontSize: 18,
        },
        statsLine: {
          ...Type.body,
          color: colors.textSecondary,
        },
        // ── Year chapter ─────────────────────────────────────────────────────
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
          opacity: 0.07,
        },
        yearMeta: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 2,
        },
        // ── Timeline spine + entries ─────────────────────────────────────────
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
        // ── Per-year mini-chart ───────────────────────────────────────────────
        chartSection: {
          marginTop: 32,
          marginHorizontal: 20,
          marginBottom: 8,
        },
        chartSectionLabel: {
          ...Type.label,
          color: colors.textMuted,
          textTransform: 'uppercase',
          marginBottom: 10,
        },
        chartRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 7,
          gap: 8,
        },
        chartYearLabel: {
          ...Type.label,
          color: colors.textSecondary,
          width: 40,
        },
        chartBarTrack: {
          flex: 1,
          height: 3,
          backgroundColor: colors.border,
          borderRadius: 2,
          overflow: 'hidden',
        },
        chartBarFill: {
          height: 3,
          borderRadius: 2,
          // width set inline; backgroundColor set inline
        },
        chartCount: {
          ...Type.label,
          color: colors.textSecondary,
          width: 24,
          textAlign: 'right',
        },
        // ── Last synced ───────────────────────────────────────────────────────
        lastSynced: {
          ...Type.body,
          color: colors.textMuted,
          textAlign: 'center',
          paddingVertical: 20,
        },
      }),
    [colors],
  );

  const { lastSyncTimestamp, notifySyncComplete } = useSyncContext();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [onThisDay, setOnThisDay] = useState<{
    setlistId: string;
    artistName: string;
    eventDate: string;
    venueName: string;
    yearsAgo: number;
  } | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const init = async () => {
      const stored = await getStoredUsername();
      if (stored) setUsername(stored);
      await loadDashboard();
    };
    init();
  }, [lastSyncTimestamp]);

  const loadDashboard = async () => {
    try {
      const [dashStats, fetchedAt, onThisDayResult] = await Promise.all([
        dbOperations.getDashboardStats(),
        dbOperations.getLastFetchedAt(),
        dbOperations.getOnThisDayConcert(),
      ]);
      setStats(dashStats);
      setOnThisDay(onThisDayResult);
      setLastSynced(fetchedAt ? fetchedAt.toLocaleString() : null);
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  const maxYearCount = Math.max(...stats.concertsByYear.map((y) => y.count), 1);

  // Determine which years each bookmark concert belongs to, so they appear
  // inside the correct year chapter in the river.
  const lastConcertYear = stats.lastConcert ? stats.lastConcert.eventDate.split('-')[2] : null;
  const firstConcertYear = stats.firstConcert ? stats.firstConcert.eventDate.split('-')[2] : null;
  const onThisDayYear = onThisDay ? onThisDay.eventDate.split('-')[2] : null;

  // Sort years descending (most recent first) for the river display.
  const yearsSorted = [...stats.concertsByYear].sort((a, b) => Number(b.year) - Number(a.year));

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="dashboard-screen"
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <Text style={styles.appTitle}>Chronicles</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              onPress={handleSync}
              accessibilityRole="button"
              accessibilityLabel="Sync concert data"
            >
              <Text style={styles.topBarIcon}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSync}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Text style={styles.topBarIcon}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.statsLine}>
          {`${stats.totalConcerts} shows · ${stats.totalArtists} artists · ${stats.totalCountries} countries`}
        </Text>
      </View>

      <TabScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Timeline river ──────────────────────────────────────────────── */}
        {yearsSorted.map((yearItem, yearIndex) => {
          const yearStr = String(yearItem.year);
          const showsInYear = yearItem.count;

          // Collect bookmark concerts that belong to this year
          const isLastConcertYear = lastConcertYear === yearStr;
          const isFirstConcertYear = firstConcertYear === yearStr;
          const isOnThisDayYear = onThisDayYear === yearStr;

          return (
            <View key={yearStr}>
              {/* Year ghost chapter heading */}
              <View style={styles.yearChapter}>
                <Text style={styles.yearGhost}>{yearStr}</Text>
                <Text style={styles.yearMeta}>
                  {`${showsInYear} show${showsInYear !== 1 ? 's' : ''}`}
                </Text>
              </View>

              {/* Spine with bookmark concert entries for this year */}
              {(isLastConcertYear || isOnThisDayYear || isFirstConcertYear) && (
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
                        {/* First entry in the most-recent year gets the glowing active dot */}
                        <View style={yearIndex === 0 ? styles.dotActive : styles.dotInactive} />
                      </View>
                      <View style={styles.entryContent}>
                        <Text style={styles.entryDate}>
                          {formatDate(stats.lastConcert.eventDate)}
                        </Text>
                        <Text style={styles.entryArtist}>{stats.lastConcert.artistName}</Text>
                      </View>
                      <Text style={styles.entryChevron}>›</Text>
                    </TouchableOpacity>
                  )}

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
                      <View style={styles.entryContent}>
                        <Text style={styles.entryDate}>
                          {formatDate(stats.firstConcert.eventDate)}
                        </Text>
                        <Text style={styles.entryArtist}>{stats.firstConcert.artistName}</Text>
                      </View>
                      <Text style={styles.entryChevron}>›</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Per-year mini-chart ─────────────────────────────────────────── */}
        {stats.concertsByYear.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartSectionLabel}>PER YEAR</Text>
            {yearsSorted.map((item) => (
              <View key={item.year} style={styles.chartRow}>
                <Text style={styles.chartYearLabel}>{item.year}</Text>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        width: `${(item.count / maxYearCount) * 100}%`,
                        backgroundColor: colors.accent,
                        opacity: 0.4,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Last synced ─────────────────────────────────────────────────── */}
        {lastSynced && (
          <Text style={styles.lastSynced}>{t('dashboard.lastSynced', { date: lastSynced })}</Text>
        )}
      </TabScrollView>
    </SafeAreaView>
  );
}
