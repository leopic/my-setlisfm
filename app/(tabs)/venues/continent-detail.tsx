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
import CountryList from '../../../src/components/CountryList';

interface CountryWithStats {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cities: string[];
}

export default function ContinentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { continentName, returnTo, returnParams } = params;
  
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
      const continentCountries = allCountries.filter(country => {
        const countryContinent = dbOperations.getContinentForCountry(country.name);
        return countryContinent === continent;
      });
      
      setCountries(continentCountries);
    } catch (error) {
      console.error('Failed to load countries for continent:', error);
      Alert.alert('Error', 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryPress = (country: CountryWithStats) => {
    console.log('🔄 Navigation:', {
      from: `/venues/continent-detail?continentName=${continentName}`,
      to: '/venues/country-detail',
      params: { 
        country: country.name,
        returnTo: '/venues/continent-detail',
        returnParams: JSON.stringify({ continentName, returnTo, returnParams })
      }
    });
    
    router.push({
      pathname: '/venues/country-detail',
      params: { 
        country: country.name,
        returnTo: '/venues/continent-detail',
        returnParams: JSON.stringify({ continentName, returnTo, returnParams })
      }
    });
  };

  const handleBackPress = () => {
    if (returnTo && returnParams) {
      try {
        const parsedParams = JSON.parse(returnParams as string);
        console.log('🔄 Navigation: Back button pressed from /venues/continent-detail');
        router.push({ pathname: returnTo as string, params: parsedParams });
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
          <Text style={styles.loadingText}>Loading countries...</Text>
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
        <Text style={styles.title}>{continentName}</Text>
        <Text style={styles.subtitle}>
          {countries.length} countr{countries.length !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      <CountryList
        countries={countries}
        onCountryPress={handleCountryPress}
        emptyMessage="No countries found in this continent"
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
    color: '#666',
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
