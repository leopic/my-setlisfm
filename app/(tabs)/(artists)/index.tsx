import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useIsFocused } from 'expo-router';
import { LegendList, type LegendListRef } from '@legendapp/list/react-native';
import { dbOperations } from '@/database/operations';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import type { SortOption } from '@/utils/sort';
import { scrollListToTop, useListTop } from '@/utils/scrollListToTop';
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
import { useLargeTitleOptions } from '@/utils/largeTitle';

export default function ArtistsScreen() {
  const { t } = useTranslation();
  const { isTablet, sidebarWidth } = useTabletLayout();
  const styles = useArtistsStyles();
  // Phone: the native large title, which collapses as the list scrolls. The iPad keeps its own
  // header above the sidebar list.
  const largeTitle = useLargeTitleOptions(t('artists.title'));

  const { lastSyncTimestamp } = useSyncContext();
  const router = useRouter();
  const [rawArtists, setRawArtists] = useState<ArtistWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  // Search and sort sit above the list (on a phone, at its top), so new results start at the
  // top, not where the old ones were.
  const listRef = useRef<LegendListRef>(null);
  const listTop = useListTop(listRef);
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
    scrollListToTop(listRef.current, listTop.top.current);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    scrollListToTop(listRef.current, listTop.top.current);
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
    // A phone shows the large title while it loads, so nothing moves when the list arrives.
    if (isTablet) {
      return (
        <>
          <Stack.Screen options={{ headerShown: false }} />
          <ListSkeleton variant="artists" />
        </>
      );
    }
    return (
      <>
        <Stack.Screen options={largeTitle} />
        <ListSkeleton variant="artists" underLargeTitle />
      </>
    );
  }

  // No data at all — hide all controls, show a full-page empty state
  if (artists.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="artists-screen"
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ArtistsHeader styles={styles} />
        <EmptyState
          icon={{ sf: 'person', md: 'person-outline' }}
          title={t('artists.empty')}
          body={t('artists.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  const subtitle =
    sortOption === 'top'
      ? t('artists.subtitleSorted', { count: artists.length })
      : t('artists.subtitle', { count: artists.length });

  // Search + sort
  const controls = (
    <ArtistsControls
      styles={styles}
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
      sortOption={sortOption}
      onSortChange={handleSortChange}
    />
  );

  // On a phone the subtitle and controls scroll with the list, under the large title.
  const list = (largeTitleHeader?: React.ReactElement) => (
    <LegendList
      ref={listRef}
      testID="artists-list"
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior={largeTitleHeader ? 'automatic' : undefined}
      onScroll={largeTitleHeader ? listTop.onScroll : undefined}
      scrollToOverflowEnabled={!!largeTitleHeader}
      contentContainerStyle={tabBarContentStyle}
      keyboardShouldPersistTaps="handled"
      data={filteredArtists}
      keyExtractor={(item) => item.mbid}
      renderItem={renderArtist}
      estimatedItemSize={72}
      recycleItems={false}
      ListHeaderComponent={largeTitleHeader}
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
  );

  if (isTablet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="artists-screen"
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.masterDetail}>
          <View style={[styles.sidebar, { width: sidebarWidth }]}>
            <ArtistsHeader styles={styles} subtitle={subtitle} />
            {controls}
            {list()}
          </View>
          <View style={styles.detailPane}>
            <ArtistDetailPane artistMbid={selectedArtistMbid} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container} testID="artists-screen">
      <Stack.Screen options={largeTitle} />
      {list(
        <>
          <Text style={[styles.headerSubtitle, styles.largeTitleSubtitle]}>{subtitle}</Text>
          {controls}
        </>,
      )}
    </SafeAreaView>
  );
}
