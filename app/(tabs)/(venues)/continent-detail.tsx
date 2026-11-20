import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import CountryList from '@/components/CountryList';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import DetailSkeleton from '@/components/skeletons/DetailSkeleton';
import { BackButton } from '@/components/ui';

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
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      // The back button's 44 pt target already adds space above its text.
      paddingTop: 4,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...Type.title1,
      color: colors.textPrimary,
    },
    subtitle: {
      ...Type.subheadline,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  const router = useRouter();
  const params = useLocalSearchParams();
  const { continentName } = params;

  const [countries, setCountries] = useState<CountryWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!continentName) return;
    let cancelled = false;
    (async () => {
      try {
        const allCountries = await dbOperations.getCountriesWithStats();
        const continentCountries = allCountries.filter((country) => {
          const countryContinent = dbOperations.getContinent(country.name);
          return countryContinent === continentName;
        });
        if (!cancelled) {
          setCountries(continentCountries);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load countries for continent:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('geo.failedToLoadCountries'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [continentName, t]);

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
        <BackButton onPress={() => router.back()} />
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
