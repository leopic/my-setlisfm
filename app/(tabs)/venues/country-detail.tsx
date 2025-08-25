import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import CityList from '../../../src/components/CityList';

interface CityWithStats {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venues: string[];
}

export default function CountryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { country, returnTo, returnParams } = params;
  
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
      const countryCities = allCities.filter(city => 
        city.countryName === countryName
      );
      
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
      pathname: '/venues/city-detail',
      params: { cityId: city.id }
    });
  };

  const handleBackPress = () => {
    if (returnTo && returnParams) {
      try {
        const parsedParams = JSON.parse(returnParams);
        router.push({ pathname: returnTo as any, params: parsedParams });
      } catch (error) {
        console.error('Error parsing return params:', error);
        router.back();
      }
    } else {
      router.back();
    }
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{country}</Text>
        <Text style={styles.subtitle}>
          {cities.length} cit{cities.length !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      <CityList
        cities={cities}
        onCityPress={handleCityPress}
        emptyMessage="No cities found in this country"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});
