import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import CityList from '@/components/CityList';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import DetailSkeleton from '@/components/skeletons/DetailSkeleton';

interface CityWithStats {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venues: string[];
}

export default function CountryDetailScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
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
      });

  const router = useRouter();
  const params = useLocalSearchParams();
  const { country } = params;

  const [cities, setCities] = useState<CityWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!country) return;
    let cancelled = false;
    (async () => {
      try {
        const allCities = await dbOperations.getCitiesWithStats();
        const countryCities = allCities.filter((city) => city.countryName === country);
        if (!cancelled) {
          setCities(countryCities);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load cities for country:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('geo.failedToLoadCities'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country, t]);

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
      <View style={styles.header}>
        <Pressable
          
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
         onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{country as string}</Text>
        <Text style={styles.subtitle}>{t('common.city', { count: cities.length })}</Text>
      </View>

      <CityList
        cities={cities}
        onCityPress={handleCityPress}
        emptyMessage={t('geo.noCitiesInCountry')}
      />
    </SafeAreaView>
  );
}
