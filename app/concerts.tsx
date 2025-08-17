import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../src/database/operations';
import type { SetlistWithDetails } from '../src/types/database';

type SortOption = 'recent' | 'alphabetical';
interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string; venueName: string; cityName?: string; stateName?: string; countryName?: string;
}

interface YearGroup {
  year: string;
  concerts: ConcertWithDetails[];
  monthStats: { [month: string]: number };
  totalConcerts: number;
}

export default function ConcertsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [filterEntityName, setFilterEntityName] = useState<string>('');

  // Get filter parameters from navigation
  const artist = params.artist as string;
  const venue = params.venue as string;

  useEffect(() => {
    loadConcerts();
    if (artist || venue) {
      loadFilterEntityName();
    }
  }, [artist, venue]);

  const loadFilterEntityName = async () => {
    try {
      if (artist) {
        // Fetch artist name by MBID
        const artistData = await dbOperations.getArtistByMbid(artist);
        if (artistData?.name) {
          setFilterEntityName(artistData.name);
        }
      } else if (venue) {
        // Fetch venue name by ID
        const venueData = await dbOperations.getVenueById(venue);
        if (venueData?.name) {
          setFilterEntityName(venueData.name);
        }
      }
    } catch (error) {
      console.error('Failed to load filter entity name:', error);
      // Fallback to ID if name fetch fails
      setFilterEntityName(artist || venue || '');
    }
  };

  const loadConcerts = async () => {
    try {
      setLoading(true);
      let rawConcerts: SetlistWithDetails[] = [];

      if (artist) {
        rawConcerts = await dbOperations.getSetlistsByArtist(artist);
      } else if (venue) {
        rawConcerts = await dbOperations.getSetlistsByVenue(venue);
      } else {
        rawConcerts = await dbOperations.getAllSetlistsWithDetails();
      }

      // Transform and add display names
      const concertsWithDetails: ConcertWithDetails[] = rawConcerts.map(concert => ({
        ...concert,
        artistName: concert.artist?.name || 'Unknown Artist',
        venueName: concert.venue?.name || 'Unknown Venue',
        cityName: concert.city?.name,
        stateName: concert.city?.state,
        countryName: concert.country?.name,
      }));

      const sortedConcerts = sortConcerts(concertsWithDetails, sortOption);
      setConcerts(sortedConcerts);
      
      // Group by year
      const grouped = groupConcertsByYear(sortedConcerts);
      setYearGroups(grouped);
      
      console.log(`Raw setlists loaded: ${rawConcerts.length}`);
      console.log('Sample event dates:', rawConcerts.slice(0, 5).map(c => ({
        artist: c.artist?.name,
        eventDate: c.eventDate,
        raw: c.eventDate
      })));
    } catch (error) {
      console.error('Failed to load concerts:', error);
      Alert.alert('Error', 'Failed to load concerts');
    } finally {
      setLoading(false);
    }
  };

  const groupConcertsByYear = (concertsToGroup: ConcertWithDetails[]): YearGroup[] => {
    const groups: { [year: string]: ConcertWithDetails[] } = {};
    
    concertsToGroup.forEach(concert => {
      if (!concert.eventDate) return;
      
      const date = parseDateCorrectly(concert.eventDate);
      const year = date.getFullYear().toString();
      
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(concert);
    });

    // Convert to array and sort by year (descending)
    return Object.entries(groups)
      .map(([year, concerts]) => {
        // Sort concerts within year by date (most recent first)
        const sortedConcerts = concerts.sort((a, b) => {
          if (!a.eventDate || !b.eventDate) return 0;
          const dateA = parseDateCorrectly(a.eventDate);
          const dateB = parseDateCorrectly(b.eventDate);
          return dateB.getTime() - dateA.getTime();
        });

        // Calculate monthly statistics
        const monthStats: { [month: string]: number } = {};
        sortedConcerts.forEach(concert => {
          if (concert.eventDate) {
            const date = parseDateCorrectly(concert.eventDate);
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            monthStats[month] = (monthStats[month] || 0) + 1;
          }
        });

        return {
          year,
          concerts: sortedConcerts,
          monthStats,
          totalConcerts: concerts.length,
        };
      })
      .sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Sort years descending
  };

  const sortConcerts = (concertsToSort: ConcertWithDetails[], sortBy: SortOption): ConcertWithDetails[] => {
    switch (sortBy) {
      case 'recent':
        return [...concertsToSort].sort((a, b) => {
          if (!a.eventDate || !b.eventDate) return 0;
          const dateA = parseDateCorrectly(a.eventDate);
          const dateB = parseDateCorrectly(b.eventDate);
          console.log(`Comparing: ${a.artist?.name} (${dateA.toISOString()}) vs ${b.artist?.name} (${dateB.toISOString()})`);
          return dateB.getTime() - dateA.getTime();
        });
      case 'alphabetical':
        return [...concertsToSort].sort((a, b) => a.artistName.localeCompare(b.artistName));
      default:
        return concertsToSort;
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

  const formatDate = (dateString: string): string => {
    try {
      const date = parseDateCorrectly(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedConcerts = sortConcerts(concerts, newSortOption);
    setConcerts(sortedConcerts);
    
    // Re-group the sorted concerts
    const grouped = groupConcertsByYear(sortedConcerts);
    setYearGroups(grouped);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConcerts();
    setRefreshing(false);
  };

  const filteredYearGroups = yearGroups.filter(yearGroup => {
    if (!searchQuery) return true;
    
    return yearGroup.concerts.some(concert =>
      concert.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concert.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (concert.cityName && concert.cityName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const totalConcerts = yearGroups.reduce((sum, group) => sum + group.totalConcerts, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading concerts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {(artist || venue) && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                // Navigate back to the source tab instead of using router.back()
                if (artist) {
                  router.replace('/artists');
                } else if (venue) {
                  router.replace('/venues');
                }
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>
          {artist ? 'Artist Concerts' : venue ? 'Venue Concerts' : 'My Concerts'}
        </Text>
        {(artist || venue) ? (
          <Text style={styles.subtitle}>
            {totalConcerts} concerts found
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            {sortOption === 'alphabetical'
              ? `${totalConcerts} concerts (alphabetical by artist)`
              : `${totalConcerts} concerts grouped by year`
            }
          </Text>
        )}
        
        {/* Filter Display */}
        {(artist || venue) && (
          <View style={styles.filterContainer}>
            <View style={styles.filterBadge}>
              <Text style={styles.filterLabel}>
                {artist ? 'Filtered by Artist' : 'Filtered by Venue'}
              </Text>
              <Text style={styles.filterValue}>
                {filterEntityName || (artist ? `Artist ID: ${artist}` : `Venue ID: ${venue}`)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => {
                // Navigate back to the source tab instead of just clearing the filter
                if (artist) {
                  router.replace('/artists');
                } else if (venue) {
                  router.replace('/venues');
                }
              }}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search artists, venues, or cities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sorting Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]}
            onPress={() => handleSortChange('recent')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'recent' && styles.sortButtonTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'alphabetical' && styles.sortButtonActive]}
            onPress={() => handleSortChange('alphabetical')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'alphabetical' && styles.sortButtonTextActive]}>
              Alphabetical
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Concerts List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredYearGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No concerts found matching your search' : 'No concerts found'}
            </Text>
          </View>
        ) : sortOption === 'alphabetical' ? (
          // Flat list for alphabetical sorting
          filteredYearGroups
            .flatMap(yearGroup => yearGroup.concerts)
            .sort((a, b) => a.artistName.localeCompare(b.artistName))
            .map((concert) => (
            <TouchableOpacity
              key={concert.id}
              style={styles.concertItem}
              onPress={() => {
                router.push({
                  pathname: '/setlist',
                  params: { id: concert.id },
                });
              }}
            >
              <View style={styles.concertHeader}>
                <Text style={styles.artistName}>{concert.artistName}</Text>
                <Text style={styles.concertDate}>{formatDate(concert.eventDate!)}</Text>
              </View>
              
              <View style={styles.concertDetails}>
                <Text style={styles.venueName}>{concert.venueName}</Text>
                {concert.cityName && (
                  <Text style={styles.locationText}>
                    {concert.cityName}
                    {concert.stateName && `, ${concert.stateName}`}
                    {concert.countryName && `, ${concert.countryName}`}
                  </Text>
                )}
              </View>

              {concert.tour?.name && (
                <Text style={styles.tourName}>{concert.tour.name}</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          // Year grouping for recent sorting
          filteredYearGroups.map((yearGroup) => (
            <View key={yearGroup.year} style={styles.yearGroup}>
              {/* Year Header with Stats */}
              <View style={styles.yearHeader}>
                <Text style={styles.yearTitle}>{yearGroup.year}</Text>
                <Text style={styles.yearStats}>
                  {yearGroup.totalConcerts} concert{yearGroup.totalConcerts !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Monthly Breakdown */}
              <View style={styles.monthlyStats}>
                {Object.entries(yearGroup.monthStats)
                  .sort((a, b) => {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                    return months.indexOf(a[0]) - months.indexOf(b[0]);
                  })
                  .map(([month, count]) => (
                    <View key={month} style={styles.monthStat}>
                      <Text style={styles.monthName}>{month}</Text>
                      <Text style={styles.monthCount}>{count}</Text>
                    </View>
                  ))}
              </View>

              {/* Concerts in this year */}
              {yearGroup.concerts.map((concert) => (
                            <TouchableOpacity
              key={concert.id}
              style={styles.concertItem}
              onPress={() => {
                router.push({
                  pathname: '/setlist',
                  params: { id: concert.id },
                });
              }}
            >
              <View style={styles.concertHeader}>
                <Text style={styles.artistName}>{concert.artistName}</Text>
                <Text style={styles.concertDate}>{formatDate(concert.eventDate!)}</Text>
              </View>

              <View style={styles.concertDetails}>
                <Text style={styles.venueName}>{concert.venueName}</Text>
                {concert.cityName && (
                  <Text style={styles.locationText}>
                    {concert.cityName}
                    {concert.stateName && `, ${concert.stateName}`}
                    {concert.countryName && `, ${concert.countryName}`}
                  </Text>
                )}
              </View>

              {concert.tour?.name && (
                <Text style={styles.tourName}>{concert.tour.name}</Text>
              )}
            </TouchableOpacity>
              ))}
            </View>
          ))
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
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  scrollView: {
    flex: 1,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 5,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  yearGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  yearStats: {
    fontSize: 14,
    color: '#666',
  },
  monthlyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  monthStat: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  monthName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  monthCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  concertItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  concertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  artistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  concertDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  concertDetails: {
    marginTop: 5,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  tourName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 5,
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
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  filterLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  filterValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  clearFilterButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  clearFilterText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
});
