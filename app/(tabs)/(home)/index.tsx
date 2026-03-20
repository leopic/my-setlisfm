import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbOperations } from '../../../src/database/operations';
import {
  syncConcertData,
  getStoredUsername,
  setStoredUsername,
} from '../../../src/services/syncService';
import { formatDate } from '../../../src/utils/date';
import { useColors } from '../../../src/utils/colors';
import DashboardSkeleton from '../../../src/components/skeletons/DashboardSkeleton';
import { ScreenHeader, StatBox, Card } from '../../../src/components/ui';

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
  const colors = useColors();
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
        emptyState: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        emptyTitle: {
          fontSize: 20,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 8,
        },
        emptySubtitle: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 22,
        },
        usernameInput: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: colors.textPrimary,
          width: '100%',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        syncButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
        },
        syncButtonDisabled: {
          opacity: 0.6,
        },
        syncButtonText: {
          color: colors.textInverse,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const init = async () => {
      const stored = await getStoredUsername();
      if (stored) setUsername(stored);
      await loadDashboard();
    };
    init();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashStats, fetchedAt] = await Promise.all([
        dbOperations.getDashboardStats(),
        dbOperations.getLastFetchedAt(),
      ]);
      setStats(dashStats);
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
      Alert.alert('Username Required', 'Enter your setlist.fm username to sync.');
      return;
    }
    setSyncing(true);
    await setStoredUsername(trimmed);
    const result = await syncConcertData(trimmed);
    if (result.success) {
      await loadDashboard();
      if (result.newConcerts > 0) {
        Alert.alert('Sync Complete', `Added ${result.newConcerts} new concerts.`);
      } else if (result.pagesProcessed > 0) {
        Alert.alert('Up to Date', 'No new concerts found.');
      }
    } else {
      Alert.alert('Sync Failed', result.error ?? 'Unknown error');
    }
    setSyncing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleSync();
    setRefreshing(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (stats.totalConcerts === 0) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <ScreenHeader title="Dashboard" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No concert data yet</Text>
          <Text style={styles.emptySubtitle}>
            Enter your setlist.fm username to sync your concert history
          </Text>
          <TextInput
            style={styles.usernameInput}
            placeholder="setlist.fm username"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleSync}
          />
          <TouchableOpacity
            style={[styles.syncButton, (syncing || !username.trim()) && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={syncing || !username.trim()}
          >
            <Text style={styles.syncButtonText}>
              {syncing ? 'Syncing...' : 'Fetch Concert Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const maxYearCount = Math.max(...stats.concertsByYear.map((y) => y.count), 1);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="dashboard-screen"
    >
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <ScreenHeader title="Dashboard" />

        {/* Hero stats */}
        <View style={styles.statsRow}>
          <StatBox value={stats.totalConcerts} label="Concerts" />
          <StatBox value={stats.totalArtists} label="Artists" />
          <StatBox value={stats.totalVenues} label="Venues" />
          <StatBox value={stats.totalCountries} label="Countries" />
        </View>

        {/* Highlights */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          {stats.topArtist && (
            <View style={styles.highlightRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightName}>{stats.topArtist.name}</Text>
                <Text style={styles.highlightSub}>Most seen artist</Text>
              </View>
              <Text style={styles.highlightDetail}>
                {stats.topArtist.count} show{stats.topArtist.count !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {stats.topVenue && (
            <View style={[styles.highlightRow, styles.highlightRowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightName}>{stats.topVenue.name}</Text>
                <Text style={styles.highlightSub}>
                  Most visited venue — {stats.topVenue.cityName}
                </Text>
              </View>
              <Text style={styles.highlightDetail}>
                {stats.topVenue.count} show{stats.topVenue.count !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </Card>

        {/* Timeline */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {stats.firstConcert && (
            <View style={styles.highlightRow}>
              <View>
                <Text style={styles.timelineDate}>{formatDate(stats.firstConcert.eventDate)}</Text>
                <Text style={styles.timelineArtist}>{stats.firstConcert.artistName}</Text>
              </View>
              <Text style={styles.highlightDetail}>First concert</Text>
            </View>
          )}
          {stats.lastConcert && (
            <View style={[styles.highlightRow, styles.highlightRowLast]}>
              <View>
                <Text style={styles.timelineDate}>{formatDate(stats.lastConcert.eventDate)}</Text>
                <Text style={styles.timelineArtist}>{stats.lastConcert.artistName}</Text>
              </View>
              <Text style={styles.highlightDetail}>Most recent</Text>
            </View>
          )}
        </Card>

        {/* Concerts by year */}
        {stats.concertsByYear.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Concerts per Year</Text>
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

        {lastSynced && <Text style={styles.lastSynced}>Last synced: {lastSynced}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
