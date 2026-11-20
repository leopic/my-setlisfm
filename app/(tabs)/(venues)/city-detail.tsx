import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import DetailSkeleton from '@/components/skeletons/DetailSkeleton';
import { BackButton, TabScrollView } from '@/components/ui';
import { Space } from '@/utils/spacing';
import { formatPlace } from '@/utils/place';

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

// "52.52°N, 13.40°E"
function formatCoordinates({ coordsLat = 0, coordsLong = 0 }: VenueWithStats): string {
  const part = (value: number, positive: string, negative: string) =>
    `${value.toFixed(2).replace('-', '')}°${value < 0 ? negative : positive}`;
  return `${part(coordsLat, 'N', 'S')}, ${part(coordsLong, 'E', 'W')}`;
}

export default function CityDetailScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Space.edge,
      // The back button's 44 pt target already adds space above its text.
      paddingTop: Space.s4,
      paddingBottom: Space.s12,
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
    },
    venuesList: {
      flex: 1,
    },
    venueRow: {
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    venueInfo: {
      flex: 1,
      marginRight: Space.s12,
    },
    venueName: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    venueLocation: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    lastConcertText: {
      ...Type.subheadline,
      color: colors.textMuted,
    },
    artistsText: {
      ...Type.subheadline,
      color: colors.textMuted,
    },
    concertCountContainer: {
      alignItems: 'center',
      minWidth: 44,
    },
    concertCountText: {
      ...Type.title3,
      color: colors.accent,
    },
    concertCountLabel: {
      ...Type.footnote,
      color: colors.textMuted,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Space.s64,
    },
    emptyStateText: {
      ...Type.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const router = useRouter();
  const params = useLocalSearchParams();
  const { city, country } = params;

  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!city || !country) return;
    let cancelled = false;
    (async () => {
      try {
        const allVenues = await dbOperations.getVenuesWithStats();
        const cityVenues = allVenues.filter(
          (venue) => venue.cityName === city && venue.countryName === country,
        );
        if (!cancelled) {
          setVenues(cityVenues);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load venues for city:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('geo.failedToLoadVenues'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city, country, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const allVenues = await dbOperations.getVenuesWithStats();
      const cityVenues = allVenues.filter(
        (venue) => venue.cityName === city && venue.countryName === country,
      );
      setVenues(cityVenues);
    } catch (error) {
      console.error('Failed to load venues for city:', error);
      Alert.alert(t('common.error'), t('geo.failedToLoadVenues'));
    }
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
    <Pressable
      key={venue.id}
      style={({ pressed }) => [styles.venueRow, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => handleVenuePress(venue)}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${t('common.visit', { count: venue.concertCount })}`}
    >
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.venueLocation}>
          {formatPlace(venue.cityName || t('common.unknownCity'), venue.state, venue.countryName)}
        </Text>
        {venue.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            {t('common.lastShow', { date: formatDate(venue.lastConcertDate) })}
          </Text>
        )}
        {venue.artists.length > 0 && (
          <Text style={styles.artistsText}>
            {t('geo.artistsList', { names: venue.artists.slice(0, 3).join(', ') })}
            {venue.artists.length > 3 &&
              ` ${t('common.moreCount', { count: venue.artists.length - 3 })}`}
          </Text>
        )}
      </View>

      <View style={styles.concertCountContainer}>
        <Text style={styles.concertCountText}>{venue.concertCount}</Text>
        <Text style={styles.concertCountLabel}>
          {t('venues.visitsLabel', { count: venue.concertCount })}
        </Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return <DetailSkeleton cardCount={3} />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>{city as string}</Text>
        <Text style={styles.subtitle}>
          {`${country} · ${t('common.venue', { count: venues.length })}`}
        </Text>
        {venues[0]?.coordsLat != null && venues[0]?.coordsLong != null && (
          <Text style={styles.subtitle}>{formatCoordinates(venues[0])}</Text>
        )}
      </View>

      <TabScrollView
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
      </TabScrollView>
    </SafeAreaView>
  );
}
