import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { formatDate } from '../utils/date';

interface CountryWithStats {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cities: string[];
}

interface CountryListProps {
  countries: CountryWithStats[];
  onCountryPress: (country: CountryWithStats) => void;
  emptyMessage?: string;
}

export default function CountryList({ 
  countries, 
  onCountryPress, 
  emptyMessage = "No countries found" 
}: CountryListProps) {
  const getCountryCard = (country: CountryWithStats) => (
    <TouchableOpacity 
      key={country.name} 
      style={styles.countryCard}
      onPress={() => onCountryPress(country)}
      activeOpacity={0.7}
    >
      <View style={styles.countryHeader}>
        <View style={styles.countryInfo}>
          <Text style={styles.countryName}>{country.name}</Text>
          <Text style={styles.countryLocation}>
            🏙️ {country.cityCount} cit{country.cityCount !== 1 ? 'ies' : 'y'}
          </Text>
        </View>
        <View style={styles.venueCountBadge}>
          <Text style={styles.venueCountText}>{country.venueCount}</Text>
          <Text style={styles.venueCountLabel}>venues</Text>
        </View>
      </View>
      
      <View style={styles.countryStats}>
        {country.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            🎵 Last show: {formatDate(country.lastConcertDate)}
          </Text>
        )}
        {country.cities.length > 0 && (
          <Text style={styles.citiesText}>
            🏙️ Cities: {country.cities.slice(0, 3).join(', ')}
            {country.cities.length > 3 && ` +${country.cities.length - 3} more`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.countriesList} showsVerticalScrollIndicator={false}>
      {countries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{emptyMessage}</Text>
        </View>
      ) : (
        countries.map(getCountryCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  countriesList: {
    flex: 1,
    padding: 20,
  },
  countryCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  countryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  countryInfo: {
    flex: 1,
    marginRight: 15,
  },
  countryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  countryLocation: {
    fontSize: 14,
    color: '#666',
  },
  venueCountBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  venueCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  venueCountLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },
  countryStats: {
    marginTop: 5,
  },
  lastConcertText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 5,
  },
  citiesText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
