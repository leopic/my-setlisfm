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
import { TabScrollView } from '@/components/ui';

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
        venuesList: {
          flex: 1,
        },
        venueRow: {
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        },
        venueInfo: {
          flex: 1,
          marginRight: 12,
        },
        venueName: {
          ...Type.title,
          color: colors.textPrimary,
        },
        venueLocation: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        lastConcertText: {
          ...Type.body,
          color: colors.textMuted,
          marginTop: 2,
        },
        artistsText: {
          ...Type.body,
          color: colors.textMuted,
          marginTop: 2,
        },
        concertCountContainer: {
          alignItems: 'center',
          minWidth: 44,
        },
        concertCountText: {
          ...Type.count,
          color: colors.accent,
        },
        concertCountLabel: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 1,
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 60,
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
      accessibilityLabel={`${venue.name}, ${venue.concertCount} ${t('venues.visits')}`}
    >
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.venueLocation}>
          {venue.cityName || 'Unknown City'}
          {venue.state && `, ${venue.state}`}
          {venue.countryName && `, ${venue.countryName}`}
        </Text>
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
      </View>

      <View style={styles.concertCountContainer}>
        <Text style={styles.concertCountText}>{venue.concertCount}</Text>
        <Text style={styles.concertCountLabel}>{t('venues.visits')}</Text>
      </View>
    </Pressable>
  );

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
        <Text style={styles.title}>{city as string}</Text>
        <Text style={styles.subtitle}>
          {`${country} · ${t('common.venue', { count: venues.length })}`}
        </Text>
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
