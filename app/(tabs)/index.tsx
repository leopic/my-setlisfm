import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { dbOperations } from '../../src/database/operations';
import { formatDate } from '../../src/utils/date';
import { useColors } from '../../src/utils/colors';

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
        header: {
          padding: 20,
          paddingTop: 10,
        },
        title: {
          fontSize: 28,
          fontWeight: 'bold',
          color: colors.textPrimary,
        },
        statsRow: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          marginBottom: 20,
        },
        statBox: {
          flex: 1,
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          padding: 14,
          marginHorizontal: 4,
          alignItems: 'center',
        },
        statNumber: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.primary,
        },
        statLabel: {
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        section: {
          marginHorizontal: 20,
          marginBottom: 16,
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          padding: 16,
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
        emptyText: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 8,
        },
        emptySubtext: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

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
    }
  };

  if (stats.totalConcerts === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No concert data yet</Text>
          <Text style={styles.emptySubtext}>
            Head to the Debug tab to fetch your concert history from Setlist.fm
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxYearCount = Math.max(...stats.concertsByYear.map((y) => y.count), 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {/* Hero stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalConcerts}</Text>
            <Text style={styles.statLabel}>Concerts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalArtists}</Text>
            <Text style={styles.statLabel}>Artists</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalVenues}</Text>
            <Text style={styles.statLabel}>Venues</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalCountries}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
        </View>

        {/* Highlights */}
        <View style={styles.section}>
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
        </View>

        {/* Timeline */}
        <View style={styles.section}>
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
        </View>

        {/* Concerts by year */}
        {stats.concertsByYear.length > 0 && (
          <View style={styles.section}>
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
          </View>
        )}

        {lastSynced && <Text style={styles.lastSynced}>Last synced: {lastSynced}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
