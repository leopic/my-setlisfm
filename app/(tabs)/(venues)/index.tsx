import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useIsFocused } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import type { SortOption } from '@/utils/sort';
import { sortByOption } from '@/utils/sort';
import { useChronicleColors } from '@/utils/colors';
import { useSyncContext } from '@/contexts/SyncContext';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import { EmptyState, HeaderSearchBar } from '@/components/ui';
import VenueDetailPane from '@/components/panes/VenueDetailPane';
import VenueListPane from '@/components/venues/VenueListPane';
import { createVenueStyles } from '@/components/venues/venueStyles';
import type { GeoStats, VenueWithStats } from '@/components/venues/types';
import { useTabletLayout } from '@/utils/tablet';
import { useLargeTitleOptions } from '@/utils/largeTitle';
import { searchInHeader } from '@/utils/searchInHeader';

export default function VenuesScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const { isTablet, sidebarWidth } = useTabletLayout();
  const styles = createVenueStyles(colors);
  // Phone: the native large title, which collapses as the list scrolls. The iPad and the
  // empty state keep their own header; header options outlive the branch that set them, so
  // each branch sets them.
  const largeTitle = useLargeTitleOptions(t('venues.title'));
  const noLargeTitle = <Stack.Screen options={{ headerShown: false }} />;

  const { lastSyncTimestamp } = useSyncContext();
  const router = useRouter();
  const [rawVenues, setRawVenues] = useState<VenueWithStats[]>([]);
  const [geoStats, setGeoStats] = useState<GeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<VenueWithStats | null>(null);

  const venues = sortByOption(rawVenues, sortOption, undefined, (v) => v.concertCount);

  const filteredVenues = searchQuery.trim()
    ? venues.filter(
        (venue) =>
          venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          venue.cityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          venue.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          venue.countryName?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : venues;

  // Load on focus, and again when a sync ends while the screen is open. Not
  // useFocusEffect(useCallback(…)): React Compiler keeps only the useCallback deps the
  // callback reads, so it dropped lastSyncTimestamp. It keeps an effect's deps as written.
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    (async () => {
      try {
        const [venuesWithStats, geoData] = await Promise.all([
          dbOperations.getVenuesWithStats(),
          dbOperations.getGeographicBreakdown(),
        ]);
        if (!cancelled) {
          setRawVenues(venuesWithStats);
          setGeoStats(geoData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load venues:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('venues.failedToLoad'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused, lastSyncTimestamp, t]);

  const handleViewConcerts = (venue: VenueWithStats) => {
    if (isTablet) {
      setSelectedVenue(venue);
    } else {
      router.push({ pathname: '/(venues)/concerts', params: { venue: venue.id } });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [venuesWithStats, geoData] = await Promise.all([
        dbOperations.getVenuesWithStats(),
        dbOperations.getGeographicBreakdown(),
      ]);
      setRawVenues(venuesWithStats);
      setGeoStats(geoData);
    } catch (error) {
      console.error('Failed to load venues:', error);
      Alert.alert(t('common.error'), t('venues.failedToLoad'));
    }
    setRefreshing(false);
  };

  if (loading) {
    // A phone shows the large title while it loads, so nothing moves when the list arrives.
    if (isTablet) {
      return (
        <>
          {noLargeTitle}
          <ListSkeleton variant="venues" />
        </>
      );
    }
    return (
      <>
        <Stack.Screen options={largeTitle} />
        {searchInHeader(true) && (
          <HeaderSearchBar
            placeholder={t('venues.searchPlaceholder')}
            onChangeText={setSearchQuery}
          />
        )}
        <ListSkeleton variant="venues" underLargeTitle />
      </>
    );
  }

  // No venues at all — hide geo strip and controls, show full-page empty state
  if (venues.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="venues-screen"
      >
        {noLargeTitle}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('venues.title')}</Text>
        </View>
        <EmptyState
          icon={{ sf: 'mappin', md: 'location-outline' }}
          title={t('venues.empty')}
          body={t('venues.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  const venueList = (
    <VenueListPane
      styles={styles}
      venueCount={venues.length}
      filteredVenues={filteredVenues}
      geoStats={geoStats}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      sortOption={sortOption}
      onSortChange={setSortOption}
      refreshing={refreshing}
      onRefresh={onRefresh}
      selectedVenueId={isTablet ? selectedVenue?.id : undefined}
      onPressVenue={handleViewConcerts}
      underLargeTitle={!isTablet}
    />
  );

  if (isTablet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="venues-screen"
      >
        {noLargeTitle}
        <View style={styles.masterDetail}>
          <View style={[styles.sidebar, { width: sidebarWidth }]}>{venueList}</View>
          <View style={styles.detailPane}>
            <VenueDetailPane venue={selectedVenue} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container} testID="venues-screen">
      <Stack.Screen options={largeTitle} />
      {venueList}
    </SafeAreaView>
  );
}
