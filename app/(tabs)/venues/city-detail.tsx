import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import { formatDate } from '../../../src/utils/date';
import { colors } from '../../../src/utils/colors';

interface VenueWithStats {
  id: string;
  name: string;
  url?: string;
  cityId?: string;
  cityName?: string;
  state?: string;
  stateCode?: string;
  countryCode?: string;
  countryName?: string;
  coordsLat?: number;
  coordsLong?: number;
  concertCount: number;
  lastConcertDate?: string;
  artists: string[];
}

export default function CityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { city, country, returnTo, returnParams } = params;

  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (city && country) {
      loadVenuesForCity(city as string, country as string);
    }
  }, [city, country]);

  const loadVenuesForCity = async (cityName: string, countryName: string) => {
    try {
      setLoading(true);
      const allVenues = await dbOperations.getVenuesWithStats();

      // Filter venues that belong to this city and country
      const cityVenues = allVenues.filter(
        (venue) => venue.cityName === cityName && venue.countryName === countryName,
      );

      setVenues(cityVenues);
    } catch (error) {
      console.error('Failed to load venues for city:', error);
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleVenuePress = (venue: VenueWithStats) => {
    router.push({
      pathname: '/venues/concerts',
      params: {
        venue: venue.id,
        returnTo: '/venues/city-detail',
        returnParams: JSON.stringify({ city, country, returnTo, returnParams }),
      },
    });
  };

  const handleBackPress = () => {
    if (returnTo && returnParams) {
      try {
        const parsedParams = JSON.parse(returnParams as string);
        router.push({ pathname: returnTo as string, params: parsedParams });
      } catch (error) {
        console.error('Error parsing return params:', error);
        router.back();
      }
    } else {
      router.back();
    }
  };

  const getVenueCard = (venue: VenueWithStats) => (
    <TouchableOpacity
      key={venue.id}
      style={styles.venueCard}
      onPress={() => handleVenuePress(venue)}
      activeOpacity={0.7}
    >
      <View style={styles.venueHeader}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueLocation}>
            📍 {venue.cityName || 'Unknown City'}
            {venue.state && `, ${venue.state}`}
            {venue.countryName && `, ${venue.countryName}`}
          </Text>
        </View>
        <View style={styles.concertCountBadge}>
          <Text style={styles.concertCountText}>{venue.concertCount}</Text>
          <Text style={styles.concertCountLabel}>visits</Text>
        </View>
      </View>

      <View style={styles.venueStats}>
        {venue.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            🎵 Last show: {formatDate(venue.lastConcertDate)}
          </Text>
        )}
        {venue.artists.length > 0 && (
          <Text style={styles.artistsText}>
            🎤 Artists: {venue.artists.slice(0, 3).join(', ')}
            {venue.artists.length > 3 && ` +${venue.artists.length - 3} more`}
          </Text>
        )}
        {venue.coordsLat && venue.coordsLong && (
          <Text style={styles.coordsText}>
            🗺️ {venue.coordsLat.toFixed(4)}, {venue.coordsLong.toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading venues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{city}</Text>
        <Text style={styles.subtitle}>
          {country} • {venues.length} venue{venues.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.venuesList} showsVerticalScrollIndicator={false}>
        {venues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No venues found in this city</Text>
          </View>
        ) : (
          venues.map(getVenueCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  venuesList: {
    flex: 1,
    padding: 20,
  },
  venueCard: {
    backgroundColor: colors.backgroundPill,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  venueInfo: {
    flex: 1,
    marginRight: 15,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  venueLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  concertCountBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  concertCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  concertCountLabel: {
    fontSize: 10,
    color: colors.textInverse,
    opacity: 0.9,
  },
  venueStats: {
    marginTop: 5,
  },
  lastConcertText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    marginBottom: 5,
  },
  artistsText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  coordsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
