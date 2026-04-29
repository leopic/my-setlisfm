import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { formatDate } from '../../../src/utils/date';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useChronicleColors } from '../../../src/utils/colors';
import { Type } from '../../../src/utils/typography';
import { useSyncContext } from '../../../src/contexts/SyncContext';
import { TabScrollView, Icon } from '../../../src/components/ui';
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
  const colors = useChronicleColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 14,
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
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginHorizontal: 20,
          marginTop: 14,
        },
        searchIcon: {
          ...Type.body,
          color: colors.textMuted,
          marginRight: 8,
        },
        searchInput: {
          flex: 1,
          ...Type.body,
          color: colors.textPrimary,
          padding: 0,
        },
        sortStrip: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 20,
          marginTop: 12,
          marginBottom: 4,
        },
        sortPill: {
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderWidth: 1,
        },
        sortPillActive: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
        sortPillInactive: {
          backgroundColor: 'transparent',
          borderColor: colors.border,
        },
        sortPillText: {
          ...Type.label,
        },
        sortPillTextActive: {
          color: colors.accent,
        },
        sortPillTextInactive: {
          color: colors.textMuted,
        },
        artistsList: {
          flex: 1,
        },
        artistRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingRight: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        artistRowAccent: {
          borderLeftWidth: 2.5,
          borderLeftColor: colors.accent,
          paddingLeft: 13.5,
        },
        artistRowNoAccent: {
          paddingLeft: 16,
        },
        rankContainer: {
          width: 30,
          alignItems: 'flex-start',
        },
        rankText: {
          ...Type.label,
        },
        rankTextTop: {
          color: colors.accent,
        },
        rankTextDefault: {
          color: colors.textMuted,
        },
        artistCenter: {
          flex: 1,
          paddingRight: 12,
        },
        artistName: {
          ...Type.title,
          color: colors.textPrimary,
        },
        lastSeenText: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        venuesText: {
          ...Type.body,
          color: colors.textMuted,
          marginTop: 1,
        },
        countText: {
          ...Type.count,
        },
        countTextTop: {
          color: colors.accent,
        },
        countTextDefault: {
          color: colors.textMuted,
        },
        chevron: {
          ...Type.body,
          color: colors.textDisabled,
          marginLeft: 8,
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 60,
          paddingHorizontal: 20,
        },
        emptyStateText: {
          ...Type.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 20,
        },
        refreshButton: {
          backgroundColor: colors.accent,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 20,
        },
        refreshButtonText: {
          ...Type.label,
          color: '#ffffff',
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

  const getArtistCard = (artist: ArtistWithStats, index: number) => {
    const rank = index + 1;
    const isTop3 = rank <= 3;
    const hasAccentBar = rank <= 2;

    return (
      <TouchableOpacity
        key={artist.mbid}
        style={[styles.artistRow, hasAccentBar ? styles.artistRowAccent : styles.artistRowNoAccent]}
        testID={`artist-${artist.mbid}`}
        activeOpacity={0.7}
        onPress={() => handleViewConcerts(artist)}
        accessibilityRole="button"
        accessibilityLabel={`${artist.name}, ${t('common.show', { count: artist.concertCount })}`}
        accessibilityHint={t('artists.viewConcertsHint')}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, isTop3 ? styles.rankTextTop : styles.rankTextDefault]}>
            #{rank}
          </Text>
        </View>

        <View style={styles.artistCenter}>
          <Text style={styles.artistName}>{artist.name}</Text>
          {artist.lastConcertDate && (
            <Text style={styles.lastSeenText}>
              {t('common.lastSeen', { date: formatDate(artist.lastConcertDate) })}
            </Text>
          )}
          {artist.venues.length > 0 && (
            <Text style={styles.venuesText} numberOfLines={1}>
              {artist.venues.slice(0, 3).join(', ')}
              {artist.venues.length > 3 && ` +${artist.venues.length - 3} more`}
            </Text>
          )}
        </View>

        <Text style={[styles.countText, isTop3 ? styles.countTextTop : styles.countTextDefault]}>
          {artist.concertCount}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="artists-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('artists.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {sortOption === 'top'
            ? t('artists.subtitleSorted', { count: artists.length })
            : t('artists.subtitle', { count: artists.length })}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Icon
          sf="magnifyingglass"
          md="search-outline"
          size={15}
          color={colors.textMuted}
          style={{ marginRight: 6 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('artists.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('artists.searchPlaceholder')}
        />
      </View>

      {/* Sort strip */}
      <View style={styles.sortStrip}>
        <TouchableOpacity
          style={[
            styles.sortPill,
            sortOption === 'recent' ? styles.sortPillActive : styles.sortPillInactive,
          ]}
          onPress={() => handleSortChange('recent')}
          accessibilityRole="button"
          accessibilityState={{ selected: sortOption === 'recent' }}
          accessibilityLabel={t('sort.mostRecent')}
        >
          <Text
            style={[
              styles.sortPillText,
              sortOption === 'recent' ? styles.sortPillTextActive : styles.sortPillTextInactive,
            ]}
          >
            {t('sort.mostRecent')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortPill,
            sortOption === 'top' ? styles.sortPillActive : styles.sortPillInactive,
          ]}
          onPress={() => handleSortChange('top')}
          accessibilityRole="button"
          accessibilityState={{ selected: sortOption === 'top' }}
          accessibilityLabel={t('sort.top')}
        >
          <Text
            style={[
              styles.sortPillText,
              sortOption === 'top' ? styles.sortPillTextActive : styles.sortPillTextInactive,
            ]}
          >
            {t('sort.top')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortPill,
            sortOption === 'alphabetical' ? styles.sortPillActive : styles.sortPillInactive,
          ]}
          onPress={() => handleSortChange('alphabetical')}
          accessibilityRole="button"
          accessibilityState={{ selected: sortOption === 'alphabetical' }}
          accessibilityLabel={t('sort.byName')}
        >
          <Text
            style={[
              styles.sortPillText,
              sortOption === 'alphabetical'
                ? styles.sortPillTextActive
                : styles.sortPillTextInactive,
            ]}
          >
            {t('sort.byName')}
          </Text>
        </TouchableOpacity>
      </View>

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
          filteredArtists.map((artist, index) => getArtistCard(artist, index))
        )}
      </TabScrollView>
    </SafeAreaView>
  );
}
