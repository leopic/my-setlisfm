import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';

type SortOption = 'alphabetical' | 'recent' | 'top';

interface CityWithStats {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venues: string[];
}

export default function CitiesScreen() {
  const router = useRouter();
  const [cities, setCities] = useState<CityWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      const citiesWithStats = await dbOperations.getCitiesWithStats();
      const sortedCities = sortCities(citiesWithStats, sortOption);
      setCities(sortedCities);
    } catch (error) {
      console.error('Failed to load cities:', error);
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const sortCities = (citiesToSort: CityWithStats[], sortBy: SortOption): CityWithStats[] => {
    switch (sortBy) {
      case 'alphabetical':
        return [...citiesToSort].sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return [...citiesToSort].sort((a, b) => {
          if (!a.lastConcertDate || !b.lastConcertDate) return 0;
          const dateA = parseDateCorrectly(a.lastConcertDate);
          const dateB = parseDateCorrectly(b.lastConcertDate);
          return dateB.getTime() - dateA.getTime();
        });
      case 'top':
        return [...citiesToSort].sort((a, b) => b.venueCount - a.venueCount);
      default:
        return citiesToSort;
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
    const sortedCities = sortCities(cities, newSortOption);
    setCities(sortedCities);
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

  const getCityCard = (city: CityWithStats) => (
    <View key={`${city.name}-${city.countryName}`} style={styles.cityCard}>
      <View style={styles.cityHeader}>
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{city.name}</Text>
          <Text style={styles.cityLocation}>
            🏳️ {city.countryName}
          </Text>
        </View>
        <View style={styles.venueCountBadge}>
          <Text style={styles.venueCountText}>{city.venueCount}</Text>
          <Text style={styles.venueCountLabel}>venues</Text>
        </View>
      </View>
      
      <View style={styles.cityStats}>
        {city.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            🎵 Last show: {formatDate(city.lastConcertDate)}
          </Text>
        )}
        {city.venues.length > 0 && (
          <Text style={styles.venuesText}>
            🏟️ Venues: {city.venues.slice(0, 3).join(', ')}
            {city.venues.length > 3 && ` +${city.venues.length - 3} more`}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cities</Text>
        <Text style={styles.subtitle}>
          {sortOption === 'top' 
            ? `${cities.length} cities (sorted by venue count)`
            : `${cities.length} cities`
          }
        </Text>
      </View>

      {/* Sorting Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortOption === 'alphabetical' && styles.sortButtonActive]} 
            onPress={() => handleSortChange('alphabetical')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'alphabetical' && styles.sortButtonTextActive]}>
              Alphabetical
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]} 
            onPress={() => handleSortChange('recent')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'recent' && styles.sortButtonTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortOption === 'top' && styles.sortButtonActive]} 
            onPress={() => handleSortChange('top')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'top' && styles.sortButtonTextActive]}>
              Top
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.citiesList} showsVerticalScrollIndicator={false}>
        {cities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No cities found</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadCities}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cities.map(getCityCard)
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
  backButton: {
    padding: 10,
    marginBottom: 10,
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
  citiesList: {
    flex: 1,
    padding: 20,
  },
  cityCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cityInfo: {
    flex: 1,
    marginRight: 15,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cityLocation: {
    fontSize: 14,
    color: '#666',
  },
  venueCountBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  venueCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  venueCountLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },
  cityStats: {
    marginTop: 5,
  },
  lastConcertText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 5,
  },
  venuesText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    paddingVertical: 20,
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
});
