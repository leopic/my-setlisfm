import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import SortAndSearch from '../../../src/components/SortAndSearch';

type SortOption = 'alphabetical' | 'recent' | 'top';

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
        dbOperations.getVenueGeoStats()
      ]);
      
      const sortedVenues = sortVenues(venuesWithStats, sortOption);
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
      pathname: '/venues/concerts',
      params: { venue: venue.id },
    });
  };

  const sortVenues = (venuesToSort: VenueWithStats[], sortBy: SortOption): VenueWithStats[] => {
    switch (sortBy) {
      case 'alphabetical':
        return [...venuesToSort].sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return [...venuesToSort].sort((a, b) => {
          if (!a.lastConcertDate || !b.lastConcertDate) return 0;
          const dateA = parseDateCorrectly(a.lastConcertDate);
          const dateB = parseDateCorrectly(b.lastConcertDate);
          return dateB.getTime() - dateA.getTime();
        });
      case 'top':
        return [...venuesToSort].sort((a, b) => b.concertCount - a.concertCount);
      default:
        return venuesToSort;
    }
  };

  // Parse DD-MM-YYYY format correctly
  const parseDateCorrectly = (dateString: string): Date => {
    try {
      const [day, month, year] = dateString.split('-').map(Number);
      // month - 1 because JavaScript months are 0-indexed
      return new Date(year, month - 1, day);
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date(0); // Return epoch date for invalid dates
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedVenues = sortVenues(venues, newSortOption);
    setVenues(sortedVenues);
  };

  const filterVenues = () => {
    if (!searchQuery.trim()) {
      setFilteredVenues(venues);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = venues.filter(venue => 
      venue.name.toLowerCase().includes(query) ||
      venue.cityName?.toLowerCase().includes(query) ||
      venue.state?.toLowerCase().includes(query) ||
      venue.countryName?.toLowerCase().includes(query)
    );
    
    setFilteredVenues(filtered);
  };

  const formatDate = (dateString: string): string => {
    try {
      const [day, month, year] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getVenueCard = (venue: VenueWithStats) => (
    <TouchableOpacity 
      key={venue.id} 
      style={styles.venueCard}
      activeOpacity={0.7}
      onPress={() => handleViewConcerts(venue)}
    >
      <View style={styles.venueHeader}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueLocation}>
            📍 {venue.cityName || 'Unknown City'}
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
            🎵 Last show: {formatDate(venue.lastConcertDate)}
          </Text>
        )}
        {venue.artists.length > 0 && (
          <Text style={styles.artistsText}>
            🎤 Artists: {venue.artists.slice(0, 3).join(', ')}
            {venue.artists.length > 3 && ` +${venue.artists.length - 3} more`}
          </Text>
        )}
        {venue.coordsLat && venue.coordsLong && (
          <Text style={styles.coordsText}>
            🗺️ {venue.coordsLat.toFixed(4)}, {venue.coordsLong.toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading venues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Venues</Text>
        <Text style={styles.subtitle}>
          {sortOption === 'top' 
            ? `${venues.length} venues (sorted by visit count)`
            : sortOption === 'recent'
            ? `${venues.length} venues (sorted by most recent)`
            : `${venues.length} venues`
          }
        </Text>
        {geoStats && (
          <>
            <View style={styles.geoStatsContainer}>
              <View style={styles.geoStatsRow}>
                <TouchableOpacity 
                  style={styles.geoStatButton}
                  onPress={() => router.push('/venues/map')}
                >
                  <Text style={styles.geoStatEmoji}>🗺️</Text>
                  <Text style={styles.geoStatText}>Map</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.geoStatButton}
                  onPress={() => router.push('/venues/continents')}
                >
                  <Text style={styles.geoStatEmoji}>🌍</Text>
                  <Text style={styles.geoStatText}>
                    {geoStats.totalContinents} continent{geoStats.totalContinents !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.geoStatsRow}>
                <TouchableOpacity 
                  style={styles.geoStatButton}
                  onPress={() => router.push('/venues/countries')}
                >
                  <Text style={styles.geoStatEmoji}>🏳️</Text>
                  <Text style={styles.geoStatText}>
                    {geoStats.totalCountries} countr{geoStats.totalCountries !== 1 ? 'ies' : 'y'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.geoStatButton}
                  onPress={() => router.push('/venues/cities')}
                >
                  <Text style={styles.geoStatEmoji}>🏙️</Text>
                  <Text style={styles.geoStatText}>
                    {geoStats.totalCities} cit{geoStats.totalCities !== 1 ? 'ies' : 'y'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Sorting Controls */}
      <SortAndSearch
        sortOption={sortOption}
        searchQuery={searchQuery}
        onSortChange={handleSortChange}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search venues, cities, countries..."
      />

      <ScrollView style={styles.venuesList} showsVerticalScrollIndicator={false}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  geoStats: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
  geoStatsContainer: {
    marginTop: 15,
    gap: 10,
  },
  geoStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  geoStatButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  geoStatEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  geoStatText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  mapButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  mapButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },

  venuesList: {
    flex: 1,
    padding: 20,
  },
  venueCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
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
    color: '#333',
    marginBottom: 5,
  },
  venueLocation: {
    fontSize: 14,
    color: '#666',
  },
  concertCountBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  concertCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  concertCountLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },
  venueStats: {
    marginTop: 5,
  },
  lastConcertText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 5,
  },
  artistsText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  coordsText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },

});
