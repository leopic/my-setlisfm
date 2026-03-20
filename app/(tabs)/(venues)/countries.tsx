import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import CountryList from '../../../src/components/CountryList';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useColors } from '../../../src/utils/colors';

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
    header: {
      padding: 20,
      backgroundColor: colors.backgroundCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 10,
      marginBottom: 10,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 15,
      paddingHorizontal: 20,
      backgroundColor: colors.backgroundCard,
      paddingVertical: 20,
    },
    sortLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 10,
    },
    sortButtons: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundPill,
      borderRadius: 20,
      borderCurve: 'continuous' as const,
      padding: 5,
    },
    sortButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 15,
      borderCurve: 'continuous' as const,
    },
    sortButtonActive: {
      backgroundColor: colors.primary,
    },
    sortButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    sortButtonTextActive: {
      color: colors.textInverse,
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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading countries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Countries</Text>
        <Text style={styles.subtitle}>
          {sortOption === 'top'
            ? `${countries.length} countries (sorted by venue count)`
            : `${countries.length} countries`}
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

      <CountryList
        countries={countries}
        onCountryPress={(country) => {
          router.push({
            pathname: '/(venues)/country-detail',
            params: { countryCode: country.code },
          });
        }}
        emptyMessage="No countries found"
      />
    </SafeAreaView>
  );
}
