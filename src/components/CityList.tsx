import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { formatDate } from '../utils/date';
import { useColors } from '../utils/colors';

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
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        citiesList: {
          flex: 1,
          padding: 20,
        },
        cityCard: {
          backgroundColor: colors.backgroundPill,
          borderRadius: 10,
          borderCurve: 'continuous' as const,
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
          color: colors.textPrimary,
          marginBottom: 5,
        },
        cityLocation: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        venueCountBadge: {
          backgroundColor: colors.success,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          borderCurve: 'continuous' as const,
          alignItems: 'center',
          minWidth: 60,
        },
        venueCountText: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.textInverse,
          fontVariant: ['tabular-nums'] as const,
        },
        venueCountLabel: {
          fontSize: 10,
          color: colors.textInverse,
          opacity: 0.9,
        },
        cityStats: {
          marginTop: 5,
        },
        lastConcertText: {
          fontSize: 14,
          color: colors.success,
          fontWeight: '500',
          marginBottom: 5,
        },
        venuesText: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 5,
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 60,
        },
        emptyStateText: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors],
  );

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
          <Text style={styles.cityLocation}>{city.countryName}</Text>
        </View>
        <View style={styles.venueCountBadge}>
          <Text style={styles.venueCountText}>{city.venueCount}</Text>
          <Text style={styles.venueCountLabel}>venues</Text>
        </View>
      </View>

      <View style={styles.cityStats}>
        {city.lastConcertDate && (
          <Text style={styles.lastConcertText}>Last show: {formatDate(city.lastConcertDate)}</Text>
        )}
        {city.venues.length > 0 && (
          <Text style={styles.venuesText}>
            Venues: {city.venues.slice(0, 3).join(', ')}
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
