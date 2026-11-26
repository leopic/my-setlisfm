import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import CountryList from '@/components/CountryList';
import type { SortOption } from '@/utils/sort';
import { sortByOption } from '@/utils/sort';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import ListScreenHeader from '@/components/ListScreenHeader';
import { Space } from '@/utils/spacing';
import { Radius } from '@/utils/radius';
import { Haptic } from '@/utils/haptics';

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
    sortPills: {
      flexDirection: 'row',
      gap: Space.s8,
      paddingHorizontal: Space.edge,
      paddingBottom: Space.s12,
      paddingTop: Space.s12,
    },
    pill: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      borderRadius: Radius.full,
      paddingHorizontal: Space.s12,
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
      ...Type.footnote,
      color: colors.accent,
    },
    pillTextInactive: {
      ...Type.footnote,
      color: colors.textMuted,
    },
  });

  const router = useRouter();
  const [rawCountries, setRawCountries] = useState<CountryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');
  // The sort pills sit above the list, so a new order starts at the top, not where the old one was.
  const listRef = useRef<ScrollViewInstance>(null);

  const countries = sortByOption(rawCountries, sortOption, undefined, (c) => c.venueCount);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const countriesWithStats = await dbOperations.getCountriesWithStats();
        if (!cancelled) {
          setRawCountries(countriesWithStats);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load countries:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('geo.failedToLoadCountries'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSortChange = (newSortOption: SortOption) => {
    if (newSortOption !== sortOption) Haptic.selection();
    setSortOption(newSortOption);
    listRef.current?.scrollTo({ y: 0, animated: true });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'alphabetical', label: t('sort.byName') },
    { value: 'top', label: t('sort.top') },
  ];

  if (loading) {
    return <ListSkeleton variant="sort" />;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="countries-screen"
    >
      {/* Inline header */}
      <ListScreenHeader
        title={t('geo.countriesTitle')}
        subtitle={
          sortOption === 'top'
            ? t('geo.countriesSubtitleSorted', { count: countries.length })
            : t('geo.countriesSubtitle', { count: countries.length })
        }
      />

      {/* Sort pills */}
      <View style={styles.sortPills}>
        {sortOptions.map((option) => (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.pill,
              sortOption === option.value ? styles.pillActive : styles.pillInactive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
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
        ref={listRef}
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
