import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Directory, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { dbOperations } from '@/database/operations';
import { clearArtistImageCache } from '@/services/artistImageService';
import { setStoredUsername } from '@/services/syncService';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useSyncContext } from '@/contexts/SyncContext';
import { TabScrollView } from '@/components/ui';

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
  const colors = useChronicleColors();
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
        // ── Header ──────────────────────────────────────────────────────────
        header: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitle: {
          ...Type.heading,
          color: colors.textPrimary,
        },
        headerSubtitle: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        // ── Stats strip ─────────────────────────────────────────────────────
        statsStrip: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        statItem: {
          flex: 1,
          alignItems: 'center',
          borderRightWidth: 1,
          borderRightColor: colors.border,
        },
        statItemLast: {
          flex: 1,
          alignItems: 'center',
        },
        statValue: {
          ...Type.count,
          color: colors.accent,
        },
        statLabel: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 2,
        },
        // ── Last synced ─────────────────────────────────────────────────────
        lastSynced: {
          ...Type.body,
          color: colors.textMuted,
          textAlign: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        // ── Section label ────────────────────────────────────────────────────
        sectionLabel: {
          ...Type.label,
          color: colors.textMuted,
          textTransform: 'uppercase',
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        // ── Action row ───────────────────────────────────────────────────────
        actionRow: {
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        actionText: {
          ...Type.title,
          color: colors.textPrimary,
        },
        actionTextDestructive: {
          ...Type.title,
          color: colors.accent,
        },
        actionArrow: {
          ...Type.body,
          color: colors.textDisabled,
        },
        // ── App info ─────────────────────────────────────────────────────────
        infoRow: {
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        infoLabel: {
          ...Type.body,
          color: colors.textSecondary,
        },
        infoValue: {
          ...Type.body,
          color: colors.textPrimary,
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Debug</Text>
          <Text style={styles.headerSubtitle}>Diagnostics &amp; data management</Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalSetlists}</Text>
            <Text style={styles.statLabel}>Setlists</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalArtists}</Text>
            <Text style={styles.statLabel}>Artists</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalVenues}</Text>
            <Text style={styles.statLabel}>Venues</Text>
          </View>
          <View style={styles.statItemLast}>
            <Text style={styles.statValue}>{stats.totalSongs}</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
        </View>

        {lastFetched && <Text style={styles.lastSynced}>Last synced: {lastFetched}</Text>}

        {/* Actions */}
        <Text style={styles.sectionLabel}>Actions</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={loadStats}
          accessibilityRole="button"
          accessibilityLabel="Refresh stats"
        >
          <Text style={styles.actionText}>Refresh Stats</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleClearImageCache}
          accessibilityRole="button"
          accessibilityLabel="Clear image cache"
        >
          <Text style={styles.actionText}>Clear Image Cache ({imageCacheSize})</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleClearDatabase}
          accessibilityRole="button"
          accessibilityLabel="Clear database"
        >
          <Text style={styles.actionTextDestructive}>Clear Database</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleResetOnboarding}
          accessibilityRole="button"
          accessibilityLabel="Reset onboarding"
        >
          <Text style={styles.actionTextDestructive}>Reset Onboarding</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        {/* App Info */}
        <Text style={styles.sectionLabel}>App Info</Text>

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
      </TabScrollView>
    </SafeAreaView>
  );
}
