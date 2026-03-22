import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Directory, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import { clearArtistImageCache } from '../../../src/services/artistImageService';
import { setStoredUsername } from '../../../src/services/syncService';
import { useColors } from '../../../src/utils/colors';
import { useSyncContext } from '../../../src/contexts/SyncContext';
import { ScreenHeader, StatBox, TabScrollView } from '../../../src/components/ui';

interface Stats {
  totalSetlists: number;
  totalArtists: number;
  totalVenues: number;
  totalSongs: number;
}

function getImageCacheSize(): string {
  try {
    const dir = new Directory(Paths.document, 'artist-images');
    if (!dir.exists) return '0 files';
    const files = dir.list();
    return `${files.length} files`;
  } catch {
    return 'unknown';
  }
}

export default function DebugScreen() {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        statsContainer: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          marginBottom: 20,
          gap: 8,
        },
        actionsContainer: {
          paddingHorizontal: 20,
          marginBottom: 20,
        },
        button: {
          paddingVertical: 15,
          paddingHorizontal: 20,
          borderRadius: 10,
          borderCurve: 'continuous' as const,
          marginBottom: 12,
          alignItems: 'center',
        },
        buttonText: {
          color: colors.textInverse,
          fontSize: 16,
          fontWeight: '600',
        },
        infoContainer: {
          paddingHorizontal: 20,
          paddingBottom: 20,
        },
        sectionTitle: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        infoLabel: {
          fontSize: 15,
          color: colors.textSecondary,
        },
        infoValue: {
          fontSize: 15,
          color: colors.textPrimary,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  const router = useRouter();
  const { lastSyncTimestamp } = useSyncContext();
  const [stats, setStats] = useState<Stats>({
    totalSetlists: 0,
    totalArtists: 0,
    totalVenues: 0,
    totalSongs: 0,
  });
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [imageCacheSize, setImageCacheSize] = useState('');

  useEffect(() => {
    loadStats();
  }, [lastSyncTimestamp]);

  const loadStats = async () => {
    try {
      const newStats = await dbOperations.getDatabaseCounts();
      setStats(newStats);
      const fetchedAt = await dbOperations.getLastFetchedAt();
      setLastFetched(fetchedAt ? fetchedAt.toLocaleString() : null);
      setImageCacheSize(getImageCacheSize());
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleClearDatabase = async () => {
    Alert.alert('Clear Database', 'This will delete ALL concert data. Are you sure?', [
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

  const handleResetOnboarding = async () => {
    Alert.alert('Reset Onboarding', 'This will clear your username and restart the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await dbOperations.clearAllData();
            await setStoredUsername('');
            router.replace('/onboarding');
          } catch (error) {
            console.error('Failed to reset onboarding:', error);
            Alert.alert('Error', 'Failed to reset onboarding');
          }
        },
      },
    ]);
  };

  const handleClearImageCache = async () => {
    try {
      clearArtistImageCache();
      setImageCacheSize(getImageCacheSize());
      Alert.alert('Success', 'Artist image cache cleared');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
      Alert.alert('Error', 'Failed to clear image cache');
    }
  };

  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const sdkVersion = Constants.expoConfig?.sdkVersion ?? 'unknown';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <TabScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Debug" subtitle="Diagnostics & data management" />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatBox value={stats.totalSetlists} label="Concerts" />
          <StatBox value={stats.totalArtists} label="Artists" />
        </View>
        <View style={styles.statsContainer}>
          <StatBox value={stats.totalVenues} label="Venues" />
          <StatBox value={stats.totalSongs} label="Songs" />
        </View>

        {lastFetched && <Text style={styles.lastFetched}>Last synced: {lastFetched}</Text>}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={loadStats}
            accessibilityRole="button"
            accessibilityLabel="Refresh stats"
          >
            <Text style={styles.buttonText}>Refresh Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.orange }]}
            onPress={handleClearImageCache}
            accessibilityRole="button"
            accessibilityLabel="Clear image cache"
          >
            <Text style={styles.buttonText}>Clear Image Cache ({imageCacheSize})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.danger }]}
            onPress={handleClearDatabase}
            accessibilityRole="button"
            accessibilityLabel="Clear database"
          >
            <Text style={styles.buttonText}>Clear Database</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.purple }]}
            onPress={handleResetOnboarding}
            accessibilityRole="button"
            accessibilityLabel="Reset onboarding"
          >
            <Text style={styles.buttonText}>Reset Onboarding</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expo SDK</Text>
            <Text style={styles.infoValue}>{sdkVersion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Image cache</Text>
            <Text style={styles.infoValue}>{imageCacheSize}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DB path</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {Paths.document.uri}
            </Text>
          </View>
        </View>
      </TabScrollView>
    </SafeAreaView>
  );
}
