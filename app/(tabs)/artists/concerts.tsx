import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import type { SetlistWithDetails } from '../../../src/types/database';
import { formatDate } from '../../../src/utils/date';
import { colors } from '../../../src/utils/colors';

interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string;
  venueName: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
}

export default function ArtistConcertsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistName, setArtistName] = useState<string>('');

  // Get artist parameter from navigation
  const artistMbid = params.artist as string;

  useEffect(() => {
    if (artistMbid) {
      loadArtistConcerts(artistMbid);
    }
  }, [artistMbid]);

  const loadArtistConcerts = async (mbid: string) => {
    try {
      setLoading(true);

      // Fetch artist name
      const artistData = await dbOperations.getArtistByMbid(mbid);
      if (artistData?.name) {
        setArtistName(artistData.name);
      }

      // Fetch concerts
      const rawConcerts = await dbOperations.getSetlistsByArtist(mbid);
      const concertsWithDetails = transformConcerts(rawConcerts);
      setConcerts(concertsWithDetails);
    } catch (error) {
      console.error('Failed to load artist concerts:', error);
      Alert.alert('Error', 'Failed to load artist concerts');
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
    // Navigate to setlist detail within artists tab
    // Pass the current artist parameter so the setlist page knows where to return
    const currentParams = { artist: artistMbid };
    router.push({
      pathname: '/artists/setlist',
      params: {
        id: concert.id,
        returnTo: '/artists/concerts',
        returnParams: JSON.stringify(currentParams),
      },
    });
  };

  const handleBackPress = () => {
    router.push('/artists');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading concerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{artistName}</Text>
        <Text style={styles.concertCount}>
          {concerts.length} Concert{concerts.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.cityCount}>
          {new Set(concerts.map((c) => c.cityName)).size} Cit
          {new Set(concerts.map((c) => c.cityName)).size !== 1 ? 'ies' : 'y'}
        </Text>
        <Text style={styles.countryCount}>
          {new Set(concerts.map((c) => c.countryName)).size} Countr
          {new Set(concerts.map((c) => c.countryName)).size !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      {/* Concerts List */}
      <ScrollView style={styles.concertsList} showsVerticalScrollIndicator={false}>
        {concerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No concerts found</Text>
          </View>
        ) : (
          concerts.map((concert) => (
            <TouchableOpacity
              key={concert.id}
              style={styles.concertItem}
              onPress={() => handleConcertPress(concert)}
            >
              <View style={styles.concertHeader}>
                <View style={styles.concertMainInfo}>
                  <Text style={styles.concertMainName}>{concert.venueName}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
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
  entityInfo: {
    backgroundColor: colors.backgroundCard,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  entityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  concertCount: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  cityCount: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  countryCount: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  concertsList: {
    flex: 1,
    padding: 20,
  },
  concertItem: {
    backgroundColor: colors.backgroundPill,
    borderRadius: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
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
});
