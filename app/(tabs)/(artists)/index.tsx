import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import SortAndSearch from '../../../src/components/SortAndSearch';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { formatDate } from '../../../src/utils/date';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useColors } from '../../../src/utils/colors';
import { useSyncContext } from '../../../src/contexts/SyncContext';
import { ScreenHeader, TabScrollView } from '../../../src/components/ui';
import ArtistImage from '../../../src/components/ArtistImage';
import { useTranslation } from 'react-i18next';

interface ArtistWithStats {
  mbid: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
  concertCount: number;
  lastConcertDate?: string;
  venues: string[];
}

export default function ArtistsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        artistsList: {
          flex: 1,
          padding: 20,
        },
        artistCard: {
          backgroundColor: colors.backgroundPill,
          borderRadius: 10,
          borderCurve: 'continuous' as const,
          padding: 15,
          marginBottom: 10,
        },
        artistHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 5,
        },
        artistInfo: {
          flex: 1,
        },
        artistName: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.textPrimary,
          marginBottom: 3,
        },
        artistDisambiguation: {
          fontSize: 14,
          color: colors.textSecondary,
          fontStyle: 'italic',
        },
        concertCountBadge: {
          backgroundColor: colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          borderCurve: 'continuous' as const,
          alignItems: 'center',
          minWidth: 60,
        },
        concertCountText: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.textInverse,
          fontVariant: ['tabular-nums'] as const,
        },
        concertCountLabel: {
          fontSize: 10,
          color: colors.textInverse,
          opacity: 0.9,
        },
        artistStats: {
          marginTop: 5,
        },
        lastConcertText: {
          fontSize: 14,
          color: colors.primary,
          fontWeight: '500',
          marginBottom: 5,
        },
        venuesText: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 60,
        },
        emptyStateText: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 20,
        },
        refreshButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 20,
          borderCurve: 'continuous' as const,
        },
        refreshButtonText: {
          color: colors.textInverse,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const { lastSyncTimestamp } = useSyncContext();
  const router = useRouter();
  const [artists, setArtists] = useState<ArtistWithStats[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<ArtistWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArtists();
  }, [lastSyncTimestamp]);

  useEffect(() => {
    filterArtists();
  }, [artists, searchQuery]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const artistsWithStats = await dbOperations.getArtistsWithStats();

      const sortedArtists = sortByOption(
        artistsWithStats,
        sortOption,
        undefined,
        (a) => a.concertCount,
      );
      setArtists(sortedArtists);
    } catch (error) {
      console.error('Failed to load artists:', error);
      Alert.alert(t('common.error'), t('artists.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewConcerts = (artist: ArtistWithStats) => {
    // Navigate to concerts list screen
    router.push({
      pathname: '/(artists)/concerts',
      params: { artist: artist.mbid },
    });
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedArtists = sortByOption(artists, newSortOption, undefined, (a) => a.concertCount);
    setArtists(sortedArtists);
  };

  const filterArtists = () => {
    if (!searchQuery.trim()) {
      setFilteredArtists(artists);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(query) ||
        artist.sortName?.toLowerCase().includes(query) ||
        artist.disambiguation?.toLowerCase().includes(query),
    );

    setFilteredArtists(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArtists();
    setRefreshing(false);
  };

  const getArtistCard = (artist: ArtistWithStats) => (
    <TouchableOpacity
      key={artist.mbid}
      style={styles.artistCard}
      testID={`artist-${artist.mbid}`}
      activeOpacity={0.7}
      onPress={() => handleViewConcerts(artist)}
      accessibilityRole="button"
      accessibilityLabel={`${artist.name}, ${t('common.show', { count: artist.concertCount })}`}
      accessibilityHint={t('artists.viewConcertsHint')}
    >
      <View style={styles.artistHeader}>
        <ArtistImage mbid={artist.mbid} size={44} name={artist.name} />
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artist.name}</Text>
        </View>
        <View style={styles.concertCountBadge}>
          <Text style={styles.concertCountText}>{artist.concertCount}</Text>
          <Text style={styles.concertCountLabel}>{t('artists.shows')}</Text>
        </View>
      </View>

      <View style={styles.artistStats}>
        {artist.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            {t('common.lastSeen', { date: formatDate(artist.lastConcertDate) })}
          </Text>
        )}
        {artist.venues.length > 0 && (
          <Text style={styles.venuesText}>
            Venues: {artist.venues.slice(0, 3).join(', ')}
            {artist.venues.length > 3 && ` +${artist.venues.length - 3} more`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="artists-screen">
      {/* Header */}
      <ScreenHeader
        title={t('artists.title')}
        subtitle={
          sortOption === 'top'
            ? t('artists.subtitleSorted', { count: artists.length })
            : t('artists.subtitle', { count: artists.length })
        }
      />

      {/* Sorting Controls */}
      <SortAndSearch
        sortOption={sortOption}
        searchQuery={searchQuery}
        onSortChange={handleSortChange}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('artists.searchPlaceholder')}
      />

      <TabScrollView
        style={styles.artistsList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredArtists.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() ? t('artists.noMatch') : t('artists.empty')}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadArtists}
              accessibilityRole="button"
            >
              <Text style={styles.refreshButtonText}>{t('common.refresh')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredArtists.map(getArtistCard)
        )}
      </TabScrollView>
    </SafeAreaView>
  );
}
