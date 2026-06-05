import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import CountryList from '@/components/CountryList';
import type { SortOption } from '@/utils/sort';
import { sortByOption } from '@/utils/sort';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import ListSkeleton from '@/components/skeletons/ListSkeleton';

interface CountryWithStats {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cities: string[];
}

export default function CountriesScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        inlineHeader: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        backRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        },
        backButton: {
          ...Type.body,
          color: colors.accent,
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
        sortPills: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
          paddingTop: 10,
        },
        pill: {
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
        },
        pillActive: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
        pillInactive: {
          backgroundColor: 'transparent',
          borderColor: colors.border,
        },
        pillTextActive: {
          ...Type.label,
          color: colors.accent,
        },
        pillTextInactive: {
          ...Type.label,
          color: colors.textMuted,
        },
      });

  const router = useRouter();
  const [countries, setCountries] = useState<CountryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');

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
      Alert.alert(t('common.error'), t('geo.failedToLoadCountries'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedCountries = sortByOption(countries, newSortOption, undefined, (c) => c.venueCount);
    setCountries(sortedCountries);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'alphabetical', label: 'By Name' },
    { value: 'top', label: 'Top' },
  ];

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="countries-screen"
    >
      {/* Inline header */}
      <View style={styles.inlineHeader}>
        <View style={styles.backRow}>
          <Pressable
            
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
         onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
        </View>
        <Text style={styles.headerTitle}>{t('geo.countriesTitle')}</Text>
        <Text style={styles.headerSubtitle}>
          {sortOption === 'top'
            ? t('geo.countriesSubtitleSorted', { count: countries.length })
            : t('geo.countriesSubtitle', { count: countries.length })}
        </Text>
      </View>

      {/* Sort pills */}
      <View style={styles.sortPills}>
        {sortOptions.map((option) => (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.pill,
              sortOption === option.value ? styles.pillActive : styles.pillInactive,
            , { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => handleSortChange(option.value)}
          >
            <Text
              style={sortOption === option.value ? styles.pillTextActive : styles.pillTextInactive}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <CountryList
        countries={countries}
        onCountryPress={(country) => {
          router.push({
            pathname: '/(venues)/country-detail',
            params: { country: country.name },
          });
        }}
        emptyMessage={t('geo.noCountriesFound')}
      />
    </SafeAreaView>
  );
}
