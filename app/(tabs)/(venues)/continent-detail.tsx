import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '../../../src/database/operations';
import CountryList from '../../../src/components/CountryList';
import { useColors } from '../../../src/utils/colors';
import DetailSkeleton from '../../../src/components/skeletons/DetailSkeleton';
import { ScreenHeader } from '../../../src/components/ui';

interface CountryWithStats {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cities: string[];
}

export default function ContinentDetailScreen() {
  const colors = useColors();
  const { t } = useTranslation();
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
      {/* Header */}
      <ScreenHeader
        title={continentName as string}
        subtitle={t('common.country', { count: countries.length })}
        showBack
        onBackPress={() => router.back()}
      />

      <CountryList
        countries={countries}
        onCountryPress={handleCountryPress}
        emptyMessage={t('geo.noCountriesInContinent')}
      />
    </SafeAreaView>
  );
}
