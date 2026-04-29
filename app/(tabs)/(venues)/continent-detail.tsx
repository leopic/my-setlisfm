import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import CountryList from '@/components/CountryList';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import DetailSkeleton from '@/components/skeletons/DetailSkeleton';

interface CountryWithStats {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cities: string[];
}

export default function ContinentDetailScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        backBtn: {
          ...Type.body,
          color: colors.accent,
          marginBottom: 6,
        },
        title: {
          ...Type.heading,
          color: colors.textPrimary,
        },
        subtitle: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
      }),
    [colors],
  );

  const router = useRouter();
  const params = useLocalSearchParams();
  const { continentName } = params;

  const [countries, setCountries] = useState<CountryWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (continentName) {
      loadCountriesForContinent(continentName as string);
    }
  }, [continentName]);

  const loadCountriesForContinent = async (continent: string) => {
    try {
      setLoading(true);
      const allCountries = await dbOperations.getCountriesWithStats();

      // Filter countries that belong to this continent
      const continentCountries = allCountries.filter((country) => {
        const countryContinent = dbOperations.getContinent(country.name);
        return countryContinent === continent;
      });

      setCountries(continentCountries);
    } catch (error) {
      console.error('Failed to load countries for continent:', error);
      Alert.alert(t('common.error'), t('geo.failedToLoadCountries'));
    } finally {
      setLoading(false);
    }
  };

  const handleCountryPress = (country: CountryWithStats) => {
    router.push({
      pathname: '/(venues)/country-detail',
      params: { country: country.name },
    });
  };

  if (loading) {
    return <DetailSkeleton cardCount={3} />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{continentName as string}</Text>
        <Text style={styles.subtitle}>{t('common.country', { count: countries.length })}</Text>
      </View>

      <CountryList
        countries={countries}
        onCountryPress={handleCountryPress}
        emptyMessage={t('geo.noCountriesInContinent')}
      />
    </SafeAreaView>
  );
}
