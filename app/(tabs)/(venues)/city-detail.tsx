import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '../../../src/database/operations';
import { formatDate } from '../../../src/utils/date';
import { useColors } from '../../../src/utils/colors';
import DetailSkeleton from '../../../src/components/skeletons/DetailSkeleton';
import { ScreenHeader } from '../../../src/components/ui';

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
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        venuesList: {
          flex: 1,
          padding: 20,
        },
        venueCard: {
          backgroundColor: colors.backgroundPill,
          borderRadius: 10,
          borderCurve: 'continuous' as const,
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
          borderCurve: 'continuous' as const,
          alignItems: 'center',
          minWidth: 60,
        },
        concertCountText: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.textInverse,
          fontVariant: ['tabular-nums'] as const,
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
      }),
    [colors],
  );

  const router = useRouter();
  const params = useLocalSearchParams();
  const { city, country } = params;

  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      Alert.alert(t('common.error'), t('geo.failedToLoadVenues'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVenuesForCity(city as string, country as string);
    setRefreshing(false);
  };

  const handleVenuePress = (venue: VenueWithStats) => {
    router.push({
      pathname: '/(venues)/concerts',
      params: {
        venue: venue.id,
      },
    });
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
            {venue.cityName || 'Unknown City'}
            {venue.state && `, ${venue.state}`}
            {venue.countryName && `, ${venue.countryName}`}
          </Text>
        </View>
        <View style={styles.concertCountBadge}>
          <Text style={styles.concertCountText}>{venue.concertCount}</Text>
          <Text style={styles.concertCountLabel}>{t('venues.visits')}</Text>
        </View>
      </View>

      <View style={styles.venueStats}>
        {venue.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            {t('common.lastShow', { date: formatDate(venue.lastConcertDate) })}
          </Text>
        )}
        {venue.artists.length > 0 && (
          <Text style={styles.artistsText}>
            Artists: {venue.artists.slice(0, 3).join(', ')}
            {venue.artists.length > 3 &&
              ` ${t('common.moreCount', { count: venue.artists.length - 3 })}`}
          </Text>
        )}
        {venue.coordsLat && venue.coordsLong && (
          <Text style={styles.coordsText}>
            {venue.coordsLat.toFixed(4)}, {venue.coordsLong.toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <DetailSkeleton cardCount={3} />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title={city as string}
        subtitle={`${country} • ${t('common.venue', { count: venues.length })}`}
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.venuesList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {venues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('geo.noVenuesInCity')}</Text>
          </View>
        ) : (
          venues.map(getVenueCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
