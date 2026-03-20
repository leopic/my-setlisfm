import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import CityList from '../../../src/components/CityList';
import { useColors } from '../../../src/utils/colors';
import DetailSkeleton from '../../../src/components/skeletons/DetailSkeleton';
import { ScreenHeader } from '../../../src/components/ui';

interface CityWithStats {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venues: string[];
}

export default function CountryDetailScreen() {
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
  const params = useLocalSearchParams();
  const { country } = params;

  const [cities, setCities] = useState<CityWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (country) {
      loadCitiesForCountry(country as string);
    }
  }, [country]);

  const loadCitiesForCountry = async (countryName: string) => {
    try {
      setLoading(true);
      const allCities = await dbOperations.getCitiesWithStats();

      // Filter cities that belong to this country
      const countryCities = allCities.filter((city) => city.countryName === countryName);

      setCities(countryCities);
    } catch (error) {
      console.error('Failed to load cities for country:', error);
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const handleCityPress = (city: CityWithStats) => {
    router.push({
      pathname: '/(venues)/city-detail',
      params: { city: city.name, country: city.countryName },
    });
  };

  if (loading) {
    return <DetailSkeleton cardCount={3} />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title={country as string}
        subtitle={`${cities.length} cit${cities.length !== 1 ? 'ies' : 'y'}`}
        showBack
        onBackPress={() => router.back()}
      />

      <CityList
        cities={cities}
        onCityPress={handleCityPress}
        emptyMessage="No cities found in this country"
      />
    </SafeAreaView>
  );
}
