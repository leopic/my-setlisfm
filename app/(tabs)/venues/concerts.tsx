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

interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string;
  venueName: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
}

export default function VenueConcertsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueName, setVenueName] = useState<string>('');

  // Get venue parameter and navigation context from navigation
  const venueId = params.venue as string;
  const returnTo = params.returnTo as string;
  const returnParams = params.returnParams as string;

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
    return rawConcerts.map(concert => ({
      ...concert,
      artistName: concert.artist?.name || 'Unknown Artist',
      venueName: concert.venue?.name || 'Unknown Venue',
      cityName: concert.city?.name,
      stateName: concert.city?.state,
      countryName: concert.country?.name,
    }));
  };

  const handleConcertPress = (concert: ConcertWithDetails) => {
    const returnInfo = {
      pathname: '/venues/concerts' as any,
      params: { venueId: venueId }
    };

    router.push({
      pathname: '/venues/setlist',
      params: {
        setlistId: concert.id,
        returnTo: JSON.stringify(returnInfo)
      }
    });
  };

  const handleBackPress = () => {
    if (returnTo && returnParams) {
      try {
        const parsedParams = JSON.parse(returnParams);
        router.push({ pathname: returnTo as any, params: parsedParams });
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
        <Text style={styles.title}>
          {venueName}
        </Text>
        <Text style={styles.visitCount}>
          {new Set(concerts.map(c => c.eventDate)).size} Visit{new Set(concerts.map(c => c.eventDate)).size !== 1 ? 's' : ''}
        </Text>
        {new Set(concerts.map(c => c.artistName)).size > 1 && (
          <Text style={styles.artistCount}>
            {new Set(concerts.map(c => c.artistName)).size} Artist{new Set(concerts.map(c => c.artistName)).size !== 1 ? 's' : ''}
          </Text>
        )}
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
                  <Text style={styles.concertMainName}>
                    {concert.artistName}
                  </Text>
                </View>
                <Text style={styles.concertDate}>{formatDate(concert.eventDate!)}</Text>
              </View>
              
              <View style={styles.concertDetails}>
                <Text style={styles.concertLocation}>
                  {concert.cityName}
                  {concert.stateName && `, ${concert.stateName}`}
                  {concert.countryName && `, ${concert.countryName}`}
                </Text>
              </View>

              {concert.tour?.name && (
                <Text style={styles.tourName}>{concert.tour.name}</Text>
              )}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
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
  entityInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  entityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  concertCount: {
    fontSize: 16,
    color: '#666',
  },
  visitCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  artistCount: {
    fontSize: 16,
    color: '#666',
  },
  concertsList: {
    flex: 1,
    padding: 20,
  },
  concertItem: {
    backgroundColor: '#f0f0f0',
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
    color: '#333',
    flexWrap: 'wrap',
  },
  concertDate: {
    fontSize: 14,
    color: '#666',
  },
  concertDetails: {
    marginTop: 5,
  },
  concertLocation: {
    fontSize: 13,
    color: '#666',
  },
  tourName: {
    fontSize: 14,
    color: '#007AFF',
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
    color: '#666',
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
