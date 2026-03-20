import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import CityList from '../../../src/components/CityList';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useColors } from '../../../src/utils/colors';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { ScreenHeader, SortBar } from '../../../src/components/ui';

interface CityWithStats {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venues: string[];
}

export default function CitiesScreen() {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors],
  );

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
      pathname: '/(venues)/city-detail',
      params: {
        city: city.name,
        country: city.countryName,
      },
    });
  };

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Cities"
        subtitle={
          sortOption === 'top'
            ? `${cities.length} cities (sorted by venue count)`
            : `${cities.length} cities`
        }
        showBack
        onBackPress={() => router.back()}
      />

      {/* Sorting Controls */}
      <SortBar value={sortOption} onChange={handleSortChange} />

      <CityList cities={cities} onCityPress={handleCityPress} emptyMessage="No cities found" />
    </SafeAreaView>
  );
}
