import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbOperations } from '../../../src/database/operations';
import { formatDate } from '../../../src/utils/date';
import { useColors } from '../../../src/utils/colors';
import { useTabBarInset } from '../../../src/utils/useTabBarInset';
import DashboardSkeleton from '../../../src/components/skeletons/DashboardSkeleton';
import { ScreenHeader, StatBox, Card, EmptyState } from '../../../src/components/ui';

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
  const tabBarInset = useTabBarInset();
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

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (stats.totalConcerts === 0) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <ScreenHeader title="Dashboard" />
        <EmptyState
          title="No concert data yet"
          subtitle="Head to the Debug tab to fetch your concert history from Setlist.fm"
        />
      </SafeAreaView>
    );
  }

  const maxYearCount = Math.max(...stats.concertsByYear.map((y) => y.count), 1);

  return (
    <View style={styles.container} testID="dashboard-screen">
      <ScrollView contentContainerStyle={tabBarInset}>
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
                <Text style={styles.timelineDate}>
                  {formatDate(stats.firstConcert.eventDate)}
                </Text>
                <Text style={styles.timelineArtist}>{stats.firstConcert.artistName}</Text>
              </View>
              <Text style={styles.highlightDetail}>First concert</Text>
            </View>
          )}
          {stats.lastConcert && (
            <View style={[styles.highlightRow, styles.highlightRowLast]}>
              <View>
                <Text style={styles.timelineDate}>
                  {formatDate(stats.lastConcert.eventDate)}
                </Text>
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
    </View>
  );
}
