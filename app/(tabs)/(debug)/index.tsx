import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import { SetlistApiService } from '../../../src/services/setlistApi';
import { DataProcessor } from '../../../src/services/dataProcessor';
import { useColors } from '../../../src/utils/colors';

interface Stats {
  totalSetlists: number;
  totalArtists: number;
  totalVenues: number;
  totalSongs: number;
}

export default function DebugScreen() {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    lastFetched: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    header: {
      padding: 20,
      paddingTop: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 12,
      borderCurve: 'continuous' as const,
      padding: 20,
      marginBottom: 15,
      marginRight: 15,
      minWidth: 80,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 5,
      fontVariant: ['tabular-nums'] as const,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actionsContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderCurve: 'continuous' as const,
      marginBottom: 15,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSecondary: {
      backgroundColor: colors.background,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderCurve: 'continuous' as const,
      marginBottom: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderMedium,
    },
    buttonTextSecondary: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    infoContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 10,
    },
    routeTestingContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 5,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 15,
    },
    routeButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    routeButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 8,
      borderCurve: 'continuous' as const,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    routeButtonText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
    },
  }), [colors]);

  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalSetlists: 0,
    totalArtists: 0,
    totalVenues: 0,
    totalSongs: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  // Create service instances
  const setlistApi = new SetlistApiService();
  const dataProcessor = new DataProcessor();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const newStats = await dbOperations.getDatabaseCounts();
      setStats(newStats);
      const fetchedAt = await dbOperations.getLastFetchedAt();
      setLastFetched(fetchedAt ? fetchedAt.toLocaleString() : null);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFetchData = async () => {
    try {
      setLoading(true);

      const username = Constants.expoConfig?.extra?.setlistfmTestUsername || 'leopic';

      // Fetch all available pages
      const allPages = await setlistApi.getAllUserAttendedConcerts(username);

      if (allPages.length === 0) {
        Alert.alert('No Data', 'No concert data found for this user');
        return;
      }

      // Process all pages
      await dataProcessor.importSetlistsFromPages(allPages);
      await dbOperations.updateLastFetchedAt();

      await loadStats();
      Alert.alert(
        'Success',
        `Data fetched successfully! Processed ${allPages.length} pages of concert data.`,
      );
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert(
        'Error',
        `Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    Alert.alert('Clear Database', 'This will delete ALL data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await dbOperations.clearAllData();
            await loadStats();
            Alert.alert('Success', 'Database cleared successfully');
          } catch (error) {
            console.error('Failed to clear database:', error);
            Alert.alert('Error', 'Failed to clear database');
          }
        },
      },
    ]);
  };

  const handleDebugArtists = async () => {
    try {
      const debugInfo = await dbOperations.debugArtistData();
      Alert.alert(
        'Artist Data Debug',
        `Total Artists: ${debugInfo.totalArtists}\n` +
          `Artists with Concerts: ${debugInfo.artistsWithConcerts}\n` +
          `Artists without Concerts: ${debugInfo.orphanedArtists}\n\n` +
          `Orphaned Artists:\n${debugInfo.orphanedArtists.slice(0, 10).join('\n')}${debugInfo.orphanedArtists.length > 10 ? '\n...and more' : ''}`,
      );
    } catch (error) {
      console.error('Failed to get debug info:', error);
      Alert.alert('Error', 'Failed to get debug info');
    }
  };

  // Route testing functions
  const testRoute = (route: string, params?: any) => {
    try {
      router.push({
        pathname: route as any,
        params: params || {},
      });
    } catch (error) {
      console.error(`Failed to navigate to ${route}:`, error);
      Alert.alert('Navigation Error', `Failed to navigate to ${route}: ${error}`);
    }
  };

  const showAvailableRoutes = () => {
    const routes = [
      '/(artists)',
      '/(venues)',
      '/(artists)/concerts?artist=test',
      '/(venues)/concerts?venue=test',
      '/(artists)/[id]?id=test',
      '/(venues)/[id]?id=test',
      '/(concerts)/[id]?id=test',
    ];

    Alert.alert(
      'Available Routes',
      `Current app routes:\n\n${routes.join('\n')}\n\nTap a route to test it:`,
      routes.map((route) => ({
        text: route,
        onPress: () => testRoute(route),
      })),
    );
  };

  const logCurrentRoute = () => {
    Alert.alert('Current Route', `Router object logged to console. Check Metro bundler logs.`);
  };

  const showRouteStructure = () => {
    Alert.alert('Route Structure', 'Route structure logged to console. Check Metro bundler logs.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Debug & Admin</Text>
          <Text style={styles.subtitle}>Database management and testing tools</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalSetlists}</Text>
            <Text style={styles.statLabel}>Concerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalArtists}</Text>
            <Text style={styles.statLabel}>Artists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalVenues}</Text>
            <Text style={styles.statLabel}>Venues</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalSongs}</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
        </View>

        {lastFetched && (
          <Text style={styles.lastFetched}>Last synced: {lastFetched}</Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleFetchData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Fetching All Data...' : 'Fetch All Concert Data'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSecondary, { backgroundColor: colors.purple }]}
            onPress={handleDebugArtists}
          >
            <Text style={styles.buttonTextSecondary}>Debug Artists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSecondary, { backgroundColor: colors.danger }]}
            onPress={handleClearDatabase}
          >
            <Text style={[styles.buttonTextSecondary, { color: colors.textInverse }]}>Clear Database</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSecondary, { backgroundColor: colors.success }]}
            onPress={loadStats}
          >
            <Text style={styles.buttonTextSecondary}>Refresh Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Route Testing Section */}
        <View style={styles.routeTestingContainer}>
          <Text style={styles.sectionTitle}>Route Testing</Text>
          <Text style={styles.sectionSubtitle}>Test navigation to different screens</Text>

          <TouchableOpacity
            style={[styles.buttonSecondary, { backgroundColor: colors.teal }]}
            onPress={showAvailableRoutes}
          >
            <Text style={styles.buttonTextSecondary}>Show All Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSecondary, { backgroundColor: colors.gray }]}
            onPress={logCurrentRoute}
          >
            <Text style={styles.buttonTextSecondary}>Log Current Route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSecondary, { backgroundColor: colors.mint }]}
            onPress={showRouteStructure}
          >
            <Text style={styles.buttonTextSecondary}>Show Route Structure</Text>
          </TouchableOpacity>

          <View style={styles.routeButtonsRow}>
            <TouchableOpacity
              style={[styles.routeButton, { backgroundColor: colors.primary }]}
              onPress={() => testRoute('/(artists)')}
            >
              <Text style={styles.routeButtonText}>Artists Tab</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.routeButton, { backgroundColor: colors.success }]}
              onPress={() => testRoute('/(venues)')}
            >
              <Text style={styles.routeButtonText}>Venues Tab</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routeButtonsRow}>
            <TouchableOpacity
              style={[styles.routeButton, { backgroundColor: colors.purple }]}
              onPress={() => testRoute('/(artists)/concerts', { artist: 'test' })}
            >
              <Text style={styles.routeButtonText}>Artist Concerts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.routeButton, { backgroundColor: colors.orange }]}
              onPress={() => testRoute('/(venues)/concerts', { venue: 'test' })}
            >
              <Text style={styles.routeButtonText}>Venue Concerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About This App</Text>
          <Text style={styles.infoText}>
            This is a Setlist.fm client app that fetches and stores concert data locally. Use the
            buttons above to manage your data and test functionality.
          </Text>
          <Text style={styles.infoText}>
            • Fetch Data: Downloads concerts from Setlist.fm API{'\n'}• Debug Artists: Shows data
            integrity information{'\n'}• Clear Database: Removes all stored data{'\n'}• Refresh
            Stats: Updates the statistics display
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
