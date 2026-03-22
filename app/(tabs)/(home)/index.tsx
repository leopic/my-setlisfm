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
import { useColors } from '../../../src/utils/colors';
import { useSyncContext } from '../../../src/contexts/SyncContext';
import DashboardSkeleton from '../../../src/components/skeletons/DashboardSkeleton';
import { ScreenHeader, StatBox, Card, TabScrollView } from '../../../src/components/ui';

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
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        statsRow: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          marginBottom: 20,
          gap: 8,
        },
        section: {
          marginHorizontal: 20,
          marginBottom: 16,
        },
        sectionTitle: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        highlightRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        highlightRowLast: {
          borderBottomWidth: 0,
        },
        highlightName: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textPrimary,
          flex: 1,
        },
        highlightDetail: {
          fontSize: 14,
          color: colors.textSecondary,
          fontVariant: ['tabular-nums'] as const,
        },
        highlightSub: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 1,
        },
        timelineDate: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.textPrimary,
        },
        timelineArtist: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 1,
        },
        yearRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
        },
        yearLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textPrimary,
          width: 44,
          fontVariant: ['tabular-nums'] as const,
        },
        yearBarContainer: {
          flex: 1,
          marginHorizontal: 10,
          height: 20,
          backgroundColor: colors.backgroundPill,
          borderRadius: 4,
          overflow: 'hidden',
        },
        yearBar: {
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: 4,
        },
        yearCount: {
          fontSize: 13,
          color: colors.textSecondary,
          width: 24,
          textAlign: 'right',
          fontVariant: ['tabular-nums'] as const,
        },
        lastSynced: {
          fontSize: 12,
          color: colors.textMuted,
          textAlign: 'center',
          paddingVertical: 16,
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

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="dashboard-screen"
    >
      <TabScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ScreenHeader title={t('dashboard.title')} />

        {/* Hero stats */}
        <View style={styles.statsRow}>
          <StatBox value={stats.totalConcerts} label={t('dashboard.concerts')} />
          <StatBox value={stats.totalArtists} label={t('dashboard.artists')} />
        </View>
        <View style={styles.statsRow}>
          <StatBox value={stats.totalVenues} label={t('dashboard.venues')} />
          <StatBox value={stats.totalCountries} label={t('dashboard.countries')} />
        </View>

        {/* Highlights */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.highlights')}</Text>
          {stats.topArtist && (
            <TouchableOpacity
              style={styles.highlightRow}
              onPress={() =>
                router.push({
                  pathname: '/(home)/artist-concerts',
                  params: { artist: stats.topArtist?.mbid },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${stats.topArtist.name}, ${t('dashboard.mostSeenArtist')}, ${t('common.show', { count: stats.topArtist.count })}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightName}>{stats.topArtist.name}</Text>
                <Text style={styles.highlightSub}>{t('dashboard.mostSeenArtist')}</Text>
              </View>
              <Text style={styles.highlightDetail}>
                {t('common.show', { count: stats.topArtist.count })}
              </Text>
            </TouchableOpacity>
          )}
          {stats.topVenue && (
            <TouchableOpacity
              style={[styles.highlightRow, styles.highlightRowLast]}
              onPress={() =>
                router.push({
                  pathname: '/(home)/venue-concerts',
                  params: { venue: stats.topVenue?.id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${stats.topVenue.name}, ${stats.topVenue.cityName}, ${t('common.show', { count: stats.topVenue.count })}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightName}>{stats.topVenue.name}</Text>
                <Text style={styles.highlightSub}>
                  {t('dashboard.mostVisitedVenue', { city: stats.topVenue.cityName })}
                </Text>
              </View>
              <Text style={styles.highlightDetail}>
                {t('common.show', { count: stats.topVenue.count })}
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Timeline */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.timeline')}</Text>
          {stats.lastConcert && (
            <TouchableOpacity
              style={[styles.highlightRow, !onThisDay && styles.highlightRowLast]}
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
              <View>
                <Text style={styles.timelineDate}>{formatDate(stats.lastConcert.eventDate)}</Text>
                <Text style={styles.timelineArtist}>{stats.lastConcert.artistName}</Text>
              </View>
              <Text style={styles.highlightDetail}>{t('dashboard.mostRecent')}</Text>
            </TouchableOpacity>
          )}
          {onThisDay && (
            <TouchableOpacity
              style={[styles.highlightRow, styles.highlightRowLast]}
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
              <View>
                <Text style={styles.timelineDate}>{formatDate(onThisDay.eventDate)}</Text>
                <Text style={styles.timelineArtist}>
                  {onThisDay.artistName} @ {onThisDay.venueName}
                </Text>
              </View>
              <Text style={styles.highlightDetail}>
                {t('dashboard.yearsAgo', { count: onThisDay.yearsAgo })}
              </Text>
            </TouchableOpacity>
          )}
          {stats.firstConcert && (
            <TouchableOpacity
              style={styles.highlightRow}
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
              <View>
                <Text style={styles.timelineDate}>{formatDate(stats.firstConcert.eventDate)}</Text>
                <Text style={styles.timelineArtist}>{stats.firstConcert.artistName}</Text>
              </View>
              <Text style={styles.highlightDetail}>{t('dashboard.firstConcert')}</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Concerts by year */}
        {stats.concertsByYear.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('dashboard.concertsPerYear')}</Text>
            {stats.concertsByYear.map((item) => (
              <View key={item.year} style={styles.yearRow}>
                <Text style={styles.yearLabel}>{item.year}</Text>
                <View style={styles.yearBarContainer}>
                  <View
                    style={[styles.yearBar, { width: `${(item.count / maxYearCount) * 100}%` }]}
                  />
                </View>
                <Text style={styles.yearCount}>{item.count}</Text>
              </View>
            ))}
          </Card>
        )}

        {lastSynced && (
          <Text style={styles.lastSynced}>{t('dashboard.lastSynced', { date: lastSynced })}</Text>
        )}
      </TabScrollView>
    </SafeAreaView>
  );
}
