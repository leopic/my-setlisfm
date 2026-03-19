import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import CityList from '../../../src/components/CityList';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';

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
      const sortedCities = sortByOption(
        citiesWithStats,
        sortOption,
        undefined,
        (c) => c.venueCount,
      );
      setCities(sortedCities);
    } catch (error) {
      console.error('Failed to load cities:', error);
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedCities = sortByOption(cities, newSortOption, undefined, (c) => c.venueCount);
    setCities(sortedCities);
  };

  const handleCityPress = (city: CityWithStats) => {
    router.push({
      pathname: '/venues/city-detail',
      params: {
        city: city.name,
        country: city.countryName,
        returnTo: '/venues/cities',
        returnParams: JSON.stringify({}),
      },
    });
  };

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/venues')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cities</Text>
        <Text style={styles.subtitle}>
          {sortOption === 'top'
            ? `${cities.length} cities (sorted by venue count)`
            : `${cities.length} cities`}
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
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'alphabetical' && styles.sortButtonTextActive,
              ]}
            >
              Alphabetical
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]}
            onPress={() => handleSortChange('recent')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'recent' && styles.sortButtonTextActive,
              ]}
            >
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'top' && styles.sortButtonActive]}
            onPress={() => handleSortChange('top')}
          >
            <Text
              style={[styles.sortButtonText, sortOption === 'top' && styles.sortButtonTextActive]}
            >
              Top
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CityList cities={cities} onCityPress={handleCityPress} emptyMessage="No cities found" />
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
    color: '#007AFF',
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
