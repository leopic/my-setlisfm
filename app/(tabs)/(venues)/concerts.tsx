import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import type { SetlistWithDetails } from '../../../src/types/database';
import { formatDate } from '../../../src/utils/date';
import { useColors } from '../../../src/utils/colors';
import { useTabBarInset } from '../../../src/utils/useTabBarInset';
import ConcertListSkeleton from '../../../src/components/skeletons/ConcertListSkeleton';
import { ScreenHeader } from '../../../src/components/ui';

interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string;
  venueName: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
}

export default function VenueConcertsListScreen() {
  const colors = useColors();
  const tabBarInset = useTabBarInset();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    concertsList: {
      flex: 1,
      padding: 20,
    },
    concertItem: {
      backgroundColor: colors.backgroundPill,
      borderRadius: 10,
      borderCurve: 'continuous' as const,
      padding: 15,
      marginBottom: 10,
    },
    concertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    concertMainInfo: {
      flex: 1,
      marginRight: 10,
    },
    concertMainName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      flexWrap: 'wrap',
    },
    concertDate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    concertDetails: {
      marginTop: 5,
    },
    concertLocation: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    tourName: {
      fontSize: 14,
      color: colors.primary,
      fontStyle: 'italic',
      marginTop: 5,
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
  }), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams();

  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueName, setVenueName] = useState<string>('');

  // Get venue parameter from navigation
  const venueId = params.venue as string;

  useEffect(() => {
    if (venueId) {
      loadVenueConcerts(venueId);
    }
  }, [venueId]);

  const loadVenueConcerts = async (id: string) => {
    try {
      setLoading(true);

      // Fetch venue name
      const venueData = await dbOperations.getVenueById(id);
      if (venueData?.name) {
        setVenueName(venueData.name);
      }

      // Fetch concerts
      const rawConcerts = await dbOperations.getSetlistsByVenue(id);
      const concertsWithDetails = transformConcerts(rawConcerts);
      setConcerts(concertsWithDetails);
    } catch (error) {
      console.error('Failed to load venue concerts:', error);
      Alert.alert('Error', 'Failed to load venue concerts');
    } finally {
      setLoading(false);
    }
  };

  const transformConcerts = (rawConcerts: SetlistWithDetails[]): ConcertWithDetails[] => {
    return rawConcerts.map((concert) => ({
      ...concert,
      artistName: concert.artist?.name || 'Unknown Artist',
      venueName: concert.venue?.name || 'Unknown Venue',
      cityName: concert.city?.name,
      stateName: concert.city?.state,
      countryName: concert.country?.name,
    }));
  };

  const handleConcertPress = (concert: ConcertWithDetails) => {
    router.push({
      pathname: '/(venues)/[id]',
      params: { id: concert.id },
    });
  };

  if (loading) {
    return <ConcertListSkeleton />;
  }

  const uniqueVisits = new Set(concerts.map((c) => c.eventDate)).size;
  const uniqueArtists = new Set(concerts.map((c) => c.artistName)).size;
  const subtitleParts = [
    `${uniqueVisits} Visit${uniqueVisits !== 1 ? 's' : ''}`,
  ];
  if (uniqueArtists > 1) {
    subtitleParts.push(`${uniqueArtists} Artist${uniqueArtists !== 1 ? 's' : ''}`);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container} testID="venue-concerts-screen">
      {/* Header */}
      <ScreenHeader
        title={venueName}
        subtitle={subtitleParts.join(' · ')}
        showBack
        onBackPress={() => router.back()}
      />

      {/* Concerts List */}
      <ScrollView style={styles.concertsList} contentContainerStyle={tabBarInset} showsVerticalScrollIndicator={false}>
        {concerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No concerts found</Text>
          </View>
        ) : (
          concerts.map((concert) => (
            <TouchableOpacity
              key={concert.id}
              style={styles.concertItem}
              testID={`venue-concert-${concert.id}`}
              onPress={() => handleConcertPress(concert)}
            >
              <View style={styles.concertHeader}>
                <View style={styles.concertMainInfo}>
                  <Text style={styles.concertMainName}>{concert.artistName}</Text>
                </View>
                <Text style={styles.concertDate}>{formatDate(concert.eventDate ?? '')}</Text>
              </View>

              <View style={styles.concertDetails}>
                <Text style={styles.concertLocation}>
                  {concert.cityName}
                  {concert.stateName && `, ${concert.stateName}`}
                  {concert.countryName && `, ${concert.countryName}`}
                </Text>
              </View>

              {concert.tour?.name && <Text style={styles.tourName}>{concert.tour.name}</Text>}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
