import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LegendList } from '@legendapp/list';
import { dbOperations } from '@/database/operations';
import { formatDate } from '@/utils/date';
import type { SortOption } from '@/utils/sort';
import { sortByOption } from '@/utils/sort';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useSyncContext } from '@/contexts/SyncContext';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import { Icon, EmptyState } from '@/components/ui';
import VenueDetailPane from '@/components/panes/VenueDetailPane';
import { useTabletLayout } from '@/utils/tablet';

interface VenueWithStats {
  id: string;
  name: string;
  url?: string;
  cityId?: string;
  cityName?: string;
  state?: string;
  stateCode?: string;
  countryCode?: string;
  countryName?: string;
  coordsLat?: number;
  coordsLong?: number;
  concertCount: number;
  lastConcertDate?: string;
  artists: string[];
}

interface GeoStats {
  totalContinents: number;
  totalCountries: number;
  totalCities: number;
  continents: string[];
  countries: string[];
  cities: string[];
}

const CONTENT_PADDING_BOTTOM = 100;

export default function VenuesScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const { isTablet, sidebarWidth } = useTabletLayout();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },

        // ── Header ───────────────────────────────────────────────────────
        header: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
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

        // ── Geo navigation strip ─────────────────────────────────────────
        geoStrip: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        geoButton: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        geoButtonLabel: {
          ...Type.label,
          color: colors.accent,
        },

        // ── Controls (pinned above list) ─────────────────────────────────
        controls: {
          backgroundColor: colors.background,
          paddingTop: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 8,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        searchInput: {
          flex: 1,
          ...Type.body,
          color: colors.textPrimary,
          padding: 0,
        },
        sortRow: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
        },
        sortPill: {
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'transparent',
        },
        sortPillActive: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
        sortPillText: {
          ...Type.label,
          color: colors.textMuted,
        },
        sortPillTextActive: {
          color: colors.accent,
        },

        // ── Venue rows ───────────────────────────────────────────────────
        venueRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        venueLeft: {
          flex: 1,
          marginRight: 12,
        },
        venueName: {
          ...Type.title,
          color: colors.textPrimary,
        },
        venueLocation: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 1,
        },
        venueLastShow: {
          ...Type.body,
          color: colors.textMuted,
          marginTop: 2,
        },
        venueArtists: {
          ...Type.body,
          color: colors.textMuted,
          marginTop: 2,
        },
        venueRight: {
          alignItems: 'center',
          minWidth: 44,
        },
        visitCount: {
          ...Type.count,
          color: colors.accent,
        },
        visitLabel: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 1,
        },

        // ── Empty state ──────────────────────────────────────────────────
        emptyState: {
          alignItems: 'center',
          paddingVertical: 60,
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
          paddingVertical: 10,
          borderRadius: 20,
        },
        refreshButtonText: {
          ...Type.label,
          color: colors.textOnAccent,
        },
        // ── Tablet master-detail ─────────────────────────────────────────
        masterDetail: { flex: 1, flexDirection: 'row' },
        sidebar: { borderRightWidth: 1, borderRightColor: colors.border },
        detailPane: { flex: 1 },
        venueRowSelected: { backgroundColor: colors.accentSoft },
      }),
    [colors],
  );

  const { lastSyncTimestamp } = useSyncContext();
  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<VenueWithStats[]>([]);
  const [geoStats, setGeoStats] = useState<GeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<VenueWithStats | null>(null);

  useEffect(() => {
    loadVenues();
  }, [lastSyncTimestamp]);

  useEffect(() => {
    filterVenues();
  }, [venues, searchQuery]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const [venuesWithStats, geoData] = await Promise.all([
        dbOperations.getVenuesWithStats(),
        dbOperations.getGeographicBreakdown(),
      ]);

      const sortedVenues = sortByOption(
        venuesWithStats,
        sortOption,
        undefined,
        (v) => v.concertCount,
      );
      setVenues(sortedVenues);
      setGeoStats(geoData);
    } catch (error) {
      console.error('Failed to load venues:', error);
      Alert.alert(t('common.error'), t('venues.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewConcerts = (venue: VenueWithStats) => {
    if (isTablet) {
      setSelectedVenue(venue);
    } else {
      router.push({ pathname: '/(venues)/concerts', params: { venue: venue.id } });
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedVenues = sortByOption(venues, newSortOption, undefined, (v) => v.concertCount);
    setVenues(sortedVenues);
  };

  const filterVenues = () => {
    if (!searchQuery.trim()) {
      setFilteredVenues(venues);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = venues.filter(
      (venue) =>
        venue.name.toLowerCase().includes(query) ||
        venue.cityName?.toLowerCase().includes(query) ||
        venue.state?.toLowerCase().includes(query) ||
        venue.countryName?.toLowerCase().includes(query),
    );

    setFilteredVenues(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVenues();
    setRefreshing(false);
  };

  const renderVenue = ({ item: venue }: { item: VenueWithStats }) => {
    const locationParts = [venue.cityName, venue.state, venue.countryName].filter(Boolean);
    const locationText = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown location';

    const topArtists = venue.artists.slice(0, 3).join(', ');
    const extraArtists = venue.artists.length > 3 ? venue.artists.length - 3 : 0;
    const artistsText =
      venue.artists.length > 0
        ? topArtists +
          (extraArtists > 0 ? ` ${t('common.moreCount', { count: extraArtists })}` : '')
        : null;

    const isSelected = isTablet && selectedVenue?.id === venue.id;

    return (
      <TouchableOpacity
        style={[styles.venueRow, isSelected && styles.venueRowSelected]}
        testID={`venue-${venue.id}`}
        activeOpacity={0.7}
        onPress={() => handleViewConcerts(venue)}
        accessibilityRole="button"
        accessibilityLabel={`${venue.name}, ${venue.concertCount} ${t('venues.visits')}`}
      >
        <View style={styles.venueLeft}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueLocation}>{locationText}</Text>
          {venue.lastConcertDate && (
            <Text style={styles.venueLastShow}>
              {t('common.lastShow', { date: formatDate(venue.lastConcertDate) })}
            </Text>
          )}
          {artistsText && <Text style={styles.venueArtists}>{artistsText}</Text>}
        </View>
        <View style={styles.venueRight}>
          <Text style={styles.visitCount}>{venue.concertCount}</Text>
          <Text style={styles.visitLabel}>{t('venues.visits')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ListSkeleton showSortBar showGeoStrip />;
  }

  // No venues at all — hide geo strip and controls, show full-page empty state
  if (venues.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="venues-screen"
      >
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

  const venueCount = venues.length;
  const subtitle =
    sortOption === 'top'
      ? t('venues.subtitleSorted', { count: venueCount })
      : sortOption === 'recent'
        ? t('venues.subtitleRecent', { count: venueCount })
        : t('venues.subtitle', { count: venueCount });

  const venueList = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('venues.title')}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {/* Geo navigation strip */}
      <View style={styles.geoStrip}>
        <TouchableOpacity
          style={styles.geoButton}
          testID="nav-continents"
          onPress={() => router.push('/(venues)/continents')}
          accessibilityRole="button"
          accessibilityLabel={t('common.continent', { count: geoStats?.totalContinents ?? 0 })}
        >
          <Text style={styles.geoButtonLabel}>Continents</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.geoButton}
          testID="nav-countries"
          onPress={() => router.push('/(venues)/countries')}
          accessibilityRole="button"
          accessibilityLabel={t('common.country', { count: geoStats?.totalCountries ?? 0 })}
        >
          <Text style={styles.geoButtonLabel}>Countries</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.geoButton}
          testID="nav-cities"
          onPress={() => router.push('/(venues)/cities')}
          accessibilityRole="button"
          accessibilityLabel={t('common.city', { count: geoStats?.totalCities ?? 0 })}
        >
          <Text style={styles.geoButtonLabel}>Cities</Text>
        </TouchableOpacity>
      </View>

      {/* Search + sort */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Icon
            sf="magnifyingglass"
            md="search-outline"
            size={15}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('venues.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.sortRow}>
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
                style={[styles.sortPill, isActive && styles.sortPillActive]}
                onPress={() => handleSortChange(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.sortPillText, isActive && styles.sortPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <LegendList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: CONTENT_PADDING_BOTTOM }}
        data={filteredVenues}
        keyExtractor={(item) => item.id}
        renderItem={renderVenue}
        estimatedItemSize={80}
        ListHeaderComponent={null}
        ListEmptyComponent={
          <EmptyState
            variant="inline"
            title={t('venues.noMatch')}
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
        testID="venues-screen"
      >
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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="venues-screen">
      {venueList}
    </SafeAreaView>
  );
}
