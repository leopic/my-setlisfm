import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { formatDate } from '../utils/date';

interface CityWithStats {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venues: string[];
}

interface CityListProps {
  cities: CityWithStats[];
  onCityPress: (city: CityWithStats) => void;
  emptyMessage?: string;
}

export default function CityList({
  cities,
  onCityPress,
  emptyMessage = 'No cities found',
}: CityListProps) {
  const getCityCard = (city: CityWithStats) => (
    <TouchableOpacity
      key={`${city.name}-${city.countryName}`}
      style={styles.cityCard}
      onPress={() => onCityPress(city)}
      activeOpacity={0.7}
    >
      <View style={styles.cityHeader}>
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{city.name}</Text>
          <Text style={styles.cityLocation}>🏳️ {city.countryName}</Text>
        </View>
        <View style={styles.venueCountBadge}>
          <Text style={styles.venueCountText}>{city.venueCount}</Text>
          <Text style={styles.venueCountLabel}>venues</Text>
        </View>
      </View>

      <View style={styles.cityStats}>
        {city.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            🎵 Last show: {formatDate(city.lastConcertDate)}
          </Text>
        )}
        {city.venues.length > 0 && (
          <Text style={styles.venuesText}>
            🏟️ Venues: {city.venues.slice(0, 3).join(', ')}
            {city.venues.length > 3 && ` +${city.venues.length - 3} more`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.citiesList} showsVerticalScrollIndicator={false}>
      {cities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{emptyMessage}</Text>
        </View>
      ) : (
        cities.map(getCityCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  citiesList: {
    flex: 1,
    padding: 20,
  },
  cityCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cityInfo: {
    flex: 1,
    marginRight: 15,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cityLocation: {
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
  cityStats: {
    marginTop: 5,
  },
  lastConcertText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 5,
  },
  venuesText: {
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
