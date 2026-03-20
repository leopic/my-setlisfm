import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import SortAndSearch from '../../../src/components/SortAndSearch';
import { formatDate } from '../../../src/utils/date';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useColors } from '../../../src/utils/colors';
import { useTabBarInset } from '../../../src/utils/useTabBarInset';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { ScreenHeader } from '../../../src/components/ui';

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

export default function VenuesScreen() {
  const colors = useColors();
  const tabBarInset = useTabBarInset();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    geoStatsContainer: {
      marginTop: 15,
      gap: 10,
      paddingHorizontal: 20,
    },
    geoStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    geoStatButton: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderCurve: 'continuous' as const,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    geoStatEmoji: {
      fontSize: 20,
      marginBottom: 4,
    },
    geoStatText: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '600',
      textAlign: 'center',
    },

    venuesList: {
      flex: 1,
      padding: 20,
    },
    venueCard: {
      backgroundColor: colors.backgroundPill,
      borderRadius: 10,
      borderCurve: 'continuous' as const,
      padding: 15,
      marginBottom: 10,
    },
    venueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    venueInfo: {
      flex: 1,
      marginRight: 15,
    },
    venueName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 5,
    },
    venueLocation: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    concertCountBadge: {
      backgroundColor: colors.success,
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
    venueStats: {
      marginTop: 5,
    },
    lastConcertText: {
      fontSize: 14,
      color: colors.success,
      fontWeight: '500',
      marginBottom: 5,
    },
    artistsText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    coordsText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: 'monospace',
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
      backgroundColor: colors.success,
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
  }), [colors]);

  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<VenueWithStats[]>([]);
  const [geoStats, setGeoStats] = useState<GeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  useEffect(() => {
    loadVenues();
  }, []);

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
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleViewConcerts = (venue: VenueWithStats) => {
    // Navigate to concerts list screen
    router.push({
      pathname: '/(venues)/concerts',
      params: { venue: venue.id },
    });
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

  const getVenueCard = (venue: VenueWithStats) => (
    <TouchableOpacity
      key={venue.id}
      style={styles.venueCard}
      testID={`venue-${venue.id}`}
      activeOpacity={0.7}
      onPress={() => handleViewConcerts(venue)}
    >
      <View style={styles.venueHeader}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueLocation}>
            {venue.cityName || 'Unknown City'}
            {venue.state && `, ${venue.state}`}
            {venue.countryName && `, ${venue.countryName}`}
          </Text>
        </View>
        <View style={styles.concertCountBadge}>
          <Text style={styles.concertCountText}>{venue.concertCount}</Text>
          <Text style={styles.concertCountLabel}>visits</Text>
        </View>
      </View>

      <View style={styles.venueStats}>
        {venue.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            Last show: {formatDate(venue.lastConcertDate)}
          </Text>
        )}
        {venue.artists.length > 0 && (
          <Text style={styles.artistsText}>
            Artists: {venue.artists.slice(0, 3).join(', ')}
            {venue.artists.length > 3 && ` +${venue.artists.length - 3} more`}
          </Text>
        )}
        {venue.coordsLat && venue.coordsLong && (
          <Text style={styles.coordsText}>
            {venue.coordsLat.toFixed(4)}, {venue.coordsLong.toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container} testID="venues-screen">
      {/* Header */}
      <ScreenHeader
        title="Venues"
        subtitle={
          sortOption === 'top'
            ? `${venues.length} venues (sorted by visit count)`
            : sortOption === 'recent'
              ? `${venues.length} venues (sorted by most recent)`
              : `${venues.length} venues`
        }
      />
      {geoStats && (
        <View style={styles.geoStatsContainer}>
          <View style={styles.geoStatsRow}>
            <TouchableOpacity
              style={styles.geoStatButton}
              onPress={() => router.push('/(venues)/map')}
            >
              <Text style={styles.geoStatEmoji}>Map</Text>
              <Text style={styles.geoStatText}>Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.geoStatButton}
              testID="nav-continents"
              onPress={() => router.push('/(venues)/continents')}
            >
              <Text style={styles.geoStatEmoji}>Continents</Text>
              <Text style={styles.geoStatText}>
                {geoStats.totalContinents} continent{geoStats.totalContinents !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.geoStatsRow}>
            <TouchableOpacity
              style={styles.geoStatButton}
              testID="nav-countries"
              onPress={() => router.push('/(venues)/countries')}
            >
              <Text style={styles.geoStatEmoji}>Countries</Text>
              <Text style={styles.geoStatText}>
                {geoStats.totalCountries} countr{geoStats.totalCountries !== 1 ? 'ies' : 'y'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.geoStatButton}
              testID="nav-cities"
              onPress={() => router.push('/(venues)/cities')}
            >
              <Text style={styles.geoStatEmoji}>Cities</Text>
              <Text style={styles.geoStatText}>
                {geoStats.totalCities} cit{geoStats.totalCities !== 1 ? 'ies' : 'y'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sorting Controls */}
      <SortAndSearch
        sortOption={sortOption}
        searchQuery={searchQuery}
        onSortChange={handleSortChange}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search venues, cities, countries..."
      />

      <ScrollView style={styles.venuesList} contentContainerStyle={tabBarInset} showsVerticalScrollIndicator={false}>
        {filteredVenues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() ? 'No venues match your search' : 'No venues found'}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadVenues}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredVenues.map(getVenueCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
