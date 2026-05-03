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
import { LegendList } from '@legendapp/list';
import { dbOperations } from '@/database/operations';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import { formatDate } from '@/utils/date';
import type { SortOption } from '@/utils/sort';
import { sortByOption } from '@/utils/sort';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useSyncContext } from '@/contexts/SyncContext';
import { Icon, EmptyState } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';

interface ArtistWithStats {
  mbid: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
  imageUrl?: string;
  concertCount: number;
  lastConcertDate?: string;
  venues: string[];
}

const CONTENT_PADDING_BOTTOM = 100;

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
        controls: {
          backgroundColor: colors.background,
          paddingTop: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
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
          marginBottom: 8,
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
          paddingBottom: 10,
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
        artistImageWrapper: {
          marginRight: 12,
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
          color: colors.textOnAccent,
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

  const renderArtist = ({ item: artist, index }: { item: ArtistWithStats; index: number }) => {
    const hasAccentBar = index < 2;

    return (
      <TouchableOpacity
        style={[styles.artistRow, hasAccentBar ? styles.artistRowAccent : styles.artistRowNoAccent]}
        testID={`artist-${artist.mbid}`}
        activeOpacity={0.7}
        onPress={() => handleViewConcerts(artist)}
        accessibilityRole="button"
        accessibilityLabel={`${artist.name}, ${t('common.show', { count: artist.concertCount })}`}
        accessibilityHint={t('artists.viewConcertsHint')}
      >
        <View style={styles.artistImageWrapper}>
          <ArtistImage mbid={artist.mbid} imageUrl={artist.imageUrl} size={40} name={artist.name} />
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

        <Text style={[styles.countText, index < 3 ? styles.countTextTop : styles.countTextDefault]}>
          {artist.concertCount}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ListSkeleton showSortBar showAvatars />;
  }

  // No data at all — hide all controls, show a full-page empty state
  if (artists.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="artists-screen"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('artists.title')}</Text>
        </View>
        <EmptyState
          icon={{ sf: 'person', md: 'person-outline' }}
          title={t('artists.empty')}
          body={t('artists.emptyBody')}
        />
      </SafeAreaView>
    );
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

      {/* Search + sort — pinned above the list */}
      <View style={styles.controls}>
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
        <View style={styles.sortStrip}>
          {(['recent', 'top', 'alphabetical'] as SortOption[]).map((option) => {
            const isActive = sortOption === option;
            const label =
              option === 'recent'
                ? t('sort.mostRecent')
                : option === 'top'
                  ? t('sort.top')
                  : t('sort.byName');
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortPill,
                  isActive ? styles.sortPillActive : styles.sortPillInactive,
                ]}
                onPress={() => handleSortChange(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={label}
              >
                <Text
                  style={[
                    styles.sortPillText,
                    isActive ? styles.sortPillTextActive : styles.sortPillTextInactive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Virtualized artist list — insight cards scroll away via ListHeaderComponent */}
      <LegendList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: CONTENT_PADDING_BOTTOM }}
        data={filteredArtists}
        keyExtractor={(item) => item.mbid}
        renderItem={renderArtist}
        estimatedItemSize={72}
        ListHeaderComponent={null}
        ListEmptyComponent={
          <EmptyState
            variant="inline"
            title={t('artists.noMatch')}
            body={t('common.tryDifferentSearch')}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
