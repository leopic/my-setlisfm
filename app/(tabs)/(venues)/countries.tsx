import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import CountryList from '../../../src/components/CountryList';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useColors } from '../../../src/utils/colors';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { ScreenHeader, SortBar } from '../../../src/components/ui';

interface CountryWithStats {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cities: string[];
}

export default function CountriesScreen() {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  }), [colors]);

  const router = useRouter();
  const [countries, setCountries] = useState<CountryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const countriesWithStats = await dbOperations.getCountriesWithStats();
      const sortedCountries = sortByOption(
        countriesWithStats,
        sortOption,
        undefined,
        (c) => c.venueCount,
      );
      setCountries(sortedCountries);
    } catch (error) {
      console.error('Failed to load countries:', error);
      Alert.alert('Error', 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedCountries = sortByOption(countries, newSortOption, undefined, (c) => c.venueCount);
    setCountries(sortedCountries);
  };

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <View style={styles.container} testID="countries-screen">
      {/* Header */}
      <ScreenHeader
        title="Countries"
        subtitle={
          sortOption === 'top'
            ? `${countries.length} countries (sorted by venue count)`
            : `${countries.length} countries`
        }
        showBack
        onBackPress={() => router.back()}
      />

      {/* Sorting Controls */}
      <SortBar value={sortOption} onChange={handleSortChange} />

      <CountryList
        countries={countries}
        onCountryPress={(country) => {
          router.push({
            pathname: '/(venues)/country-detail',
            params: { country: country.name },
          });
        }}
        emptyMessage="No countries found"
      />
    </View>
  );
}
