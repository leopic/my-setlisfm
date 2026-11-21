import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useIsFocused } from 'expo-router';
import { LegendList, type LegendListRef } from '@legendapp/list/react-native';
import { dbOperations } from '@/database/operations';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import type { SortOption } from '@/utils/sort';
import { scrollListToTop } from '@/utils/scrollListToTop';
import { sortByOption } from '@/utils/sort';
import { useSyncContext } from '@/contexts/SyncContext';
import { EmptyState, tabBarContentStyle } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import ArtistDetailPane from '@/components/panes/ArtistDetailPane';
import ArtistRow from '@/components/artists/ArtistRow';
import ArtistsControls from '@/components/artists/ArtistsControls';
import ArtistsHeader from '@/components/artists/ArtistsHeader';
import type { ArtistWithStats } from '@/components/artists/types';
import { useArtistsStyles } from '@/components/artists/useArtistsStyles';
import { useTabletLayout } from '@/utils/tablet';

export default function ArtistsScreen() {
  const { t } = useTranslation();
  const { isTablet, sidebarWidth } = useTabletLayout();
  const styles = useArtistsStyles();

  const { lastSyncTimestamp } = useSyncContext();
  const router = useRouter();
  const [rawArtists, setRawArtists] = useState<ArtistWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  // Search and sort sit above the list, so new results start at the top, not where the old ones were.
  const listRef = useRef<LegendListRef>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArtistMbid, setSelectedArtistMbid] = useState<string | null>(null);

  const artists = sortByOption(rawArtists, sortOption, undefined, (a) => a.concertCount);

  const filteredArtists = searchQuery.trim()
    ? artists.filter(
        (artist) =>
          artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artist.sortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artist.disambiguation?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : artists;

  // Load on focus, and again when a sync ends while the screen is open. Not
  // useFocusEffect(useCallback(…)): React Compiler keeps only the useCallback deps the
  // callback reads, so it dropped lastSyncTimestamp. It keeps an effect's deps as written.
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    (async () => {
      try {
        const artistsWithStats = await dbOperations.getArtistsWithStats();
        if (!cancelled) {
          setRawArtists(artistsWithStats);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load artists:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('artists.failedToLoad'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused, lastSyncTimestamp, t]);

  const handleViewConcerts = (artist: ArtistWithStats) => {
    if (isTablet) {
      setSelectedArtistMbid(artist.mbid);
    } else {
      router.push({ pathname: '/(artists)/concerts', params: { artist: artist.mbid } });
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    scrollListToTop(listRef.current);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    scrollListToTop(listRef.current);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const artistsWithStats = await dbOperations.getArtistsWithStats();
      setRawArtists(artistsWithStats);
    } catch (error) {
      console.error('Failed to load artists:', error);
      Alert.alert(t('common.error'), t('artists.failedToLoad'));
    }
    setRefreshing(false);
  };

  const renderArtist = ({ item: artist, index }: { item: ArtistWithStats; index: number }) => (
    <ArtistRow
      styles={styles}
      artist={artist}
      index={index}
      isSelected={isTablet && selectedArtistMbid === artist.mbid}
      onPress={handleViewConcerts}
    />
  );

  if (loading) {
    return <ListSkeleton variant="artists" />;
  }

  // No data at all — hide all controls, show a full-page empty state
  if (artists.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="artists-screen"
      >
        <ArtistsHeader styles={styles} />
        <EmptyState
          icon={{ sf: 'person', md: 'person-outline' }}
          title={t('artists.empty')}
          body={t('artists.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  const artistList = (
    <>
      {/* Header */}
      <ArtistsHeader
        styles={styles}
        subtitle={
          sortOption === 'top'
            ? t('artists.subtitleSorted', { count: artists.length })
            : t('artists.subtitle', { count: artists.length })
        }
      />

      {/* Search + sort */}
      <ArtistsControls
        styles={styles}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />

      <LegendList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={tabBarContentStyle}
        keyboardShouldPersistTaps="handled"
        data={filteredArtists}
        keyExtractor={(item) => item.mbid}
        renderItem={renderArtist}
        estimatedItemSize={72}
        recycleItems={false}
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
    </>
  );

  if (isTablet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="artists-screen"
      >
        <View style={styles.masterDetail}>
          <View style={[styles.sidebar, { width: sidebarWidth }]}>{artistList}</View>
          <View style={styles.detailPane}>
            <ArtistDetailPane artistMbid={selectedArtistMbid} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="artists-screen">
      {artistList}
    </SafeAreaView>
  );
}
