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
    // Navigate to setlist detail within artists tab
    // Pass the current artist parameter so the setlist page knows where to return
    const currentParams = { artist: artistMbid };
    console.log('🔄 Navigation:', {
      from: '/artists/concerts',
      to: '/artists/setlist',
      params: { 
        id: concert.id,
        returnTo: '/artists/concerts',
        returnParams: currentParams
      }
    });
    router.push({
      pathname: '/artists/setlist',
      params: { 
        id: concert.id,
        returnTo: '/artists/concerts',
        returnParams: JSON.stringify(currentParams)
      },
    });
  };

  const handleBackPress = () => {
    console.log('🔄 Navigation: Back button pressed from /artists/concerts');
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
        <Text style={styles.title}>
          Artist Concerts
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Artist Info */}
      <View style={styles.entityInfo}>
        <Text style={styles.entityName}>{artistName}</Text>
        <Text style={styles.concertCount}>
          {(() => {
            const uniqueVisits = new Set(concerts.map(c => c.eventDate + '|' + c.venueId)).size;
            const totalPerformances = concerts.length;
            if (uniqueVisits === totalPerformances) {
              return `${uniqueVisits} visit${uniqueVisits !== 1 ? 's' : ''}`;
            } else {
              return `${uniqueVisits} visit${uniqueVisits !== 1 ? 's' : ''}, ${totalPerformances} performance${totalPerformances !== 1 ? 's' : ''}`;
            }
          })()}
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
                  <Text style={styles.concertMainName}>
                    {concert.venueName}
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
