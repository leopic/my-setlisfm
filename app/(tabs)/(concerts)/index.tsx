import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useIsFocused, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LegendList, type LegendListRef } from '@legendapp/list/react-native';
import { dbOperations } from '@/database/operations';
import { parseSetlistDate } from '@/utils/date';
import type { SortOption } from '@/utils/sort';
import { scrollListToTop, useListTop } from '@/utils/scrollListToTop';
import { useLargeTitleOptions } from '@/utils/largeTitle';
import { searchInHeader } from '@/utils/searchInHeader';
import { sortMenuInHeader } from '@/utils/sortMenuInHeader';
import { useSyncContext } from '@/contexts/SyncContext';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import { EmptyState, HeaderSearchBar, tabBarContentStyle } from '@/components/ui';
import SetlistDetailPane from '@/components/panes/SetlistDetailPane';
import ConcertFlatRow from '@/components/concerts/ConcertFlatRow';
import ConcertsControls from '@/components/concerts/ConcertsControls';
import ConcertsToolbar from '@/components/concerts/ConcertsToolbar';
import { yearMenuInHeader } from '@/components/concerts/yearMenuInHeader';
import ConcertsHeader, { ConcertsSubtitle } from '@/components/concerts/ConcertsHeader';
import ConcertYearGroup from '@/components/concerts/ConcertYearGroup';
import type { ConcertListItem, ConcertWithDetails, YearGroup } from '@/components/concerts/types';
import { useConcertsStyles } from '@/components/concerts/useConcertsStyles';
import { useTabletLayout } from '@/utils/tablet';

function groupConcertsByYear(concertsToGroup: ConcertWithDetails[]): YearGroup[] {
  const groups: { [year: string]: ConcertWithDetails[] } = {};
  concertsToGroup.forEach((concert) => {
    if (!concert.eventDate) return;
    const year = parseSetlistDate(concert.eventDate).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(concert);
  });
  return Object.entries(groups)
    .map(([year, cts]) => {
      const sortedConcerts = cts.sort((a, b) => {
        if (!a.eventDate || !b.eventDate) return 0;
        return parseSetlistDate(b.eventDate).getTime() - parseSetlistDate(a.eventDate).getTime();
      });
      const monthStats: { [month: string]: number } = {};
      sortedConcerts.forEach((concert) => {
        if (concert.eventDate) {
          const month = parseSetlistDate(concert.eventDate).toLocaleDateString('en-US', {
            month: 'long',
          });
          monthStats[month] = (monthStats[month] || 0) + 1;
        }
      });
      return { year, concerts: sortedConcerts, monthStats, totalConcerts: cts.length };
    })
    .sort((a, b) => parseInt(b.year) - parseInt(a.year));
}

// The groups of the picked year (all when null), keeping only the concerts that match the search.
function filterYearGroups(yearGroups: YearGroup[], year: string | null, searchQuery: string) {
  const groups = year ? yearGroups.filter((g) => g.year === year) : yearGroups;
  if (!searchQuery.trim()) return groups;
  const q = searchQuery.toLowerCase();
  return groups.flatMap((group) => {
    const concerts = group.concerts.filter(
      (c) =>
        c.artistName.toLowerCase().includes(q) ||
        c.venueName.toLowerCase().includes(q) ||
        (c.cityName && c.cityName.toLowerCase().includes(q)) ||
        (c.countryName && c.countryName.toLowerCase().includes(q)),
    );
    return concerts.length > 0 ? [{ ...group, concerts }] : [];
  });
}

// By year: one item per year group. By name: one flat row per concert.
function toListData(groups: YearGroup[], sortOption: SortOption): ConcertListItem[] {
  if (sortOption === 'alphabetical') {
    return groups
      .flatMap((g) => g.concerts)
      .sort((a, b) => a.artistName.localeCompare(b.artistName))
      .map((concert) => ({ type: 'concert' as const, concert }));
  }
  return groups.map((yearGroup, yearIndex) => ({
    type: 'year' as const,
    yearGroup,
    yearIndex,
  }));
}

function keyExtractor(item: ConcertListItem) {
  if (item.type === 'year') return `year-${item.yearGroup.year}`;
  return `concert-${item.concert.id}`;
}

function sortConcerts(
  concertsToSort: ConcertWithDetails[],
  sortBy: SortOption,
): ConcertWithDetails[] {
  if (sortBy === 'alphabetical') {
    return [...concertsToSort].sort((a, b) => a.artistName.localeCompare(b.artistName));
  }
  return [...concertsToSort].sort((a, b) => {
    if (!a.eventDate || !b.eventDate) return 0;
    return parseSetlistDate(b.eventDate).getTime() - parseSetlistDate(a.eventDate).getTime();
  });
}

export default function ConcertsScreen() {
  const { t } = useTranslation();
  const { isTablet, sidebarWidth } = useTabletLayout();
  const styles = useConcertsStyles();
  // Phone: the native large title, which collapses as the list scrolls. The iPad and the
  // empty state keep their own header; header options outlive the branch that set them, so
  // each branch sets them.
  const largeTitle = useLargeTitleOptions(t('concerts.title'));
  const noLargeTitle = <Stack.Screen options={{ headerShown: false }} />;

  const { lastSyncTimestamp } = useSyncContext();
  const [rawConcerts, setRawConcerts] = useState<ConcertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  // Search, year and sort sit above the list (on a phone, at its top), so new results start at
  // the top, not where the old ones were.
  const listRef = useRef<LegendListRef>(null);
  const listTop = useListTop(listRef);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConcertId, setSelectedConcertId] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const concerts = sortConcerts(rawConcerts, sortOption);
  const yearGroups = groupConcertsByYear(concerts);

  // Load on focus, and again when a sync ends while the screen is open. Not
  // useFocusEffect(useCallback(…)): React Compiler keeps only the useCallback deps the
  // callback reads, so it dropped lastSyncTimestamp. It keeps an effect's deps as written.
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    (async () => {
      try {
        const fetched = await dbOperations.getAllSetlists();
        const concertsWithDetails: ConcertWithDetails[] = fetched.map((concert) => ({
          ...concert,
          artistName: concert.artist?.name || t('common.unknownArtist'),
          venueName: concert.venue?.name || t('common.unknownVenue'),
          cityName: concert.city?.name,
          stateName: concert.city?.state,
          countryName: concert.country?.name,
        }));
        if (!cancelled) {
          setRawConcerts(concertsWithDetails);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load concerts:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('concerts.failedToLoad'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused, lastSyncTimestamp, t]);

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
      const fetched = await dbOperations.getAllSetlists();
      const concertsWithDetails: ConcertWithDetails[] = fetched.map((concert) => ({
        ...concert,
        artistName: concert.artist?.name || t('common.unknownArtist'),
        venueName: concert.venue?.name || t('common.unknownVenue'),
        cityName: concert.city?.name,
        stateName: concert.city?.state,
        countryName: concert.country?.name,
      }));
      setRawConcerts(concertsWithDetails);
    } catch (error) {
      console.error('Failed to load concerts:', error);
      Alert.alert(t('common.error'), t('concerts.failedToLoad'));
    }
    setRefreshing(false);
  };

  // A picked year that a sync took away counts as All Years, so the list, the subtitle and the
  // year menu agree.
  const pickedYear = yearGroups.find((g) => g.year === yearFilter);
  const activeYear = pickedYear?.year ?? null;
  const listData = toListData(filterYearGroups(yearGroups, activeYear, searchQuery), sortOption);

  const totalConcerts = yearGroups.reduce((sum, g) => sum + g.totalConcerts, 0);
  // The subtitle counts the picked year's shows (search aside, like the total), and names the year.
  const subtitleCount = pickedYear?.totalConcerts ?? totalConcerts;

  const handleSelectYear = (year: string | null) => {
    setYearFilter(year);
    setYearDropdownOpen(false);
    scrollListToTop(listRef.current, listTop.top.current);
  };

  // iPad: a row shows its setlist in the side pane.
  const handleConcertPress = (concert: ConcertWithDetails) => setSelectedConcertId(concert.id);
  // Phone: a row opens the setlist through a Link, which gives the long-press preview.
  const concertHref = isTablet
    ? undefined
    : (concert: ConcertWithDetails): Href => ({
        pathname: '/(concerts)/[id]',
        params: { id: concert.id },
      });

  const renderItem = ({ item }: { item: ConcertListItem }) => {
    if (item.type === 'year') {
      return (
        <ConcertYearGroup
          yearGroup={item.yearGroup}
          yearIndex={item.yearIndex}
          isTablet={isTablet}
          selectedConcertId={selectedConcertId}
          onConcertPress={handleConcertPress}
          concertHref={concertHref}
          styles={styles}
        />
      );
    }
    return (
      <ConcertFlatRow
        concert={item.concert}
        isTablet={isTablet}
        selectedConcertId={selectedConcertId}
        onConcertPress={handleConcertPress}
        concertHref={concertHref}
        styles={styles}
      />
    );
  };

  // On an iPhone the search field is in the native bar, from the first render on.
  const nativeSearch = searchInHeader(!isTablet);
  const searchBar = (
    <HeaderSearchBar
      placeholder={t('concerts.searchPlaceholder')}
      onChangeText={handleSearchChange}
    />
  );

  if (loading) {
    // A phone shows the large title while it loads, so nothing moves when the list arrives.
    if (isTablet) {
      return (
        <>
          {noLargeTitle}
          <ListSkeleton variant="sort" />
        </>
      );
    }
    return (
      <>
        <Stack.Screen options={largeTitle} />
        {nativeSearch && searchBar}
        <ListSkeleton variant="sort" underLargeTitle />
      </>
    );
  }

  // No concerts at all — hide controls, show full-page empty state
  if (concerts.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="concerts-screen"
      >
        {noLargeTitle}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('concerts.title')}</Text>
        </View>
        <EmptyState
          icon={{ sf: 'music.note.list', md: 'musical-notes-outline' }}
          title={t('concerts.empty')}
          body={t('concerts.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  // Search, year + sort (on an iPhone all three are in the native bar)
  const nativeYearMenu = yearMenuInHeader(!isTablet);
  const nativeSort = sortMenuInHeader(!isTablet);
  const controls = (
    <ConcertsControls
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
      showSearch={!nativeSearch}
      showYearFilter={!nativeYearMenu}
      showSort={!nativeSort}
      years={yearGroups.map((g) => g.year)}
      yearFilter={activeYear}
      yearDropdownOpen={yearDropdownOpen}
      onOpenYearDropdown={() => setYearDropdownOpen(true)}
      onCloseYearDropdown={() => setYearDropdownOpen(false)}
      onSelectYear={handleSelectYear}
      sortOption={sortOption}
      onSortChange={handleSortChange}
      styles={styles}
    />
  );

  // On a phone the subtitle and controls scroll with the list, under the large title.
  const list = (largeTitleHeader?: React.ReactElement) => (
    <LegendList
      ref={listRef}
      testID="concerts-list"
      style={{ flex: 1 }}
      // See useListTop: the list starts under the large title and scrolls back to there.
      contentInsetAdjustmentBehavior={largeTitleHeader ? 'automatic' : undefined}
      onScroll={largeTitleHeader ? listTop.onScroll : undefined}
      scrollToOverflowEnabled={!!largeTitleHeader}
      // One tap works with the keyboard up (under a large title the controls are in the list).
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={tabBarContentStyle}
      data={listData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      estimatedItemSize={sortOption === 'alphabetical' ? 72 : 300}
      recycleItems={false}
      ListHeaderComponent={largeTitleHeader}
      ListEmptyComponent={
        <EmptyState
          title={searchQuery.trim() ? t('common.noMatchesFound') : t('concerts.empty')}
          subtitle={searchQuery.trim() ? t('common.tryDifferentSearch') : undefined}
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
        testID="concerts-screen"
      >
        {noLargeTitle}
        <View style={styles.masterDetail}>
          <View style={[styles.sidebar, { width: sidebarWidth }]}>
            <ConcertsHeader
              sortOption={sortOption}
              totalConcerts={subtitleCount}
              year={pickedYear?.year}
              styles={styles}
            />
            {controls}
            {list()}
          </View>
          <View style={styles.detailPane}>
            <SetlistDetailPane concertId={selectedConcertId} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container} testID="concerts-screen">
      <Stack.Screen options={largeTitle} />
      {nativeSearch && searchBar}
      {(nativeYearMenu || nativeSort) && (
        <ConcertsToolbar
          yearGroups={yearGroups}
          yearFilter={activeYear}
          onSelectYear={handleSelectYear}
          sortOption={sortOption}
          onSortChange={handleSortChange}
        />
      )}
      {list(
        <>
          <ConcertsSubtitle
            sortOption={sortOption}
            totalConcerts={subtitleCount}
            year={pickedYear?.year}
            style={[styles.headerSubtitle, styles.largeTitleSubtitle]}
          />
          {controls}
        </>,
      )}
    </SafeAreaView>
  );
}
