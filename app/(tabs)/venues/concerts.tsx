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
    return rawConcerts.map(concert => ({
      ...concert,
      artistName: concert.artist?.name || 'Unknown Artist',
      venueName: concert.venue?.name || 'Unknown Venue',
      cityName: concert.city?.name,
      stateName: concert.city?.state,
      countryName: concert.country?.name,
    }));
  };

  const formatDate = (dateString: string): string => {
    try {
      const [day, month, year] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleConcertPress = (concert: ConcertWithDetails) => {
    // Navigate to setlist detail within venues tab
    // Pass the current venue parameter so the setlist page knows where to return
    const currentParams = { venue: venueId };
    console.log('🔄 Navigation:', {
      from: '/venues/concerts',
      to: '/venues/setlist',
      params: { 
        id: concert.id,
        returnTo: '/venues/concerts',
        returnParams: currentParams
      }
    });
    router.push({
      pathname: '/venues/setlist',
      params: { 
        id: concert.id,
        returnTo: '/venues/concerts',
        returnParams: JSON.stringify(currentParams)
      },
    });
  };

  const handleBackPress = () => {
    console.log('🔄 Navigation: Back button pressed from /venues/concerts');
    router.push('/venues');
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
          Venue Concerts
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Venue Info */}
      <View style={styles.entityInfo}>
        <Text style={styles.entityName}>{venueName}</Text>
        <Text style={styles.concertCount}>
          {concerts.length} concert{concerts.length !== 1 ? 's' : ''}
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
                <Text style={styles.concertMainName}>
                  {concert.artistName}
                </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
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
  concertsList: {
    flex: 1,
    padding: 20,
  },
  concertItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  concertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  concertMainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
