import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../src/database/operations';
import type { SetlistWithDetails, SetWithSongs, SongWithDetails } from '../src/types/database';

export default function SetlistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [setlist, setSetlist] = useState<SetlistWithDetails | null>(null);
  const [sets, setSets] = useState<SetWithSongs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSetlistDetails();
    }
  }, [id]);

  const loadSetlistDetails = async () => {
    try {
      setLoading(true);
      const setlistData = await dbOperations.getSetlistById(id);
      if (setlistData) {
        setSetlist(setlistData);
        // Sets are now included in the setlist data
        setSets(setlistData.sets || []);
      }
    } catch (error) {
      console.error('Failed to load setlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const [day, month, year] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getSetTitle = (set: SetWithSongs, index: number): string => {
    if (set.encore) {
      return `Encore ${set.encore}`;
    }
    if (set.name && set.name !== 'Set 1:' && set.name !== 'Set 1') {
      return set.name;
    }
    // If there's only one set or it's the first set, call it "Main Set"
    if (setlist?.sets && setlist.sets.filter(s => s.songs && s.songs.length > 0).length === 1) {
      return 'Main Set';
    }
    return index === 0 ? 'Main Set' : `Set ${index + 1}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading setlist...</Text>
      </SafeAreaView>
    );
  }

  if (!setlist) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Setlist not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{setlist.artist?.name || 'Unknown Artist'}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Concert Info */}
        <View style={styles.concertInfo}>
          <Text style={styles.venueName}>{setlist.venue?.name || 'Unknown Venue'}</Text>
          <Text style={styles.dateText}>{formatDate(setlist.eventDate!)}</Text>
          {setlist.tour?.name && (
            <Text style={styles.tourName}>{setlist.tour.name}</Text>
          )}
        </View>

        {/* Location */}
        {setlist.city?.name && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              {setlist.city.name}
              {setlist.city.state && `, ${setlist.city.state}`}
              {setlist.country?.name && `, ${setlist.country.name}`}
            </Text>
          </View>
        )}

        {/* Sets */}
        {sets.filter(set => set.songs && set.songs.length > 0).map((set, index) => (
          <View key={set.id} style={styles.setContainer}>
            <Text style={styles.setTitle}>{getSetTitle(set, index)}</Text>
            {set.songs?.map((song, songIndex) => (
              <View key={songIndex} style={styles.songItem}>
                <Text style={styles.songName}>
                  {song.tape && '📼 '}
                  {song.name}
                  {song.info && ` (${song.info})`}
                </Text>
                {song.withArtistMbid && (
                  <Text style={styles.withArtistText}>
                    with {song.withArtistMbid}
                  </Text>
                )}
                {song.coverArtistMbid && (
                  <Text style={styles.coverArtistText}>
                    cover of {song.coverArtistMbid}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Empty state if no sets */}
        {sets.filter(set => set.songs && set.songs.length > 0).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No setlist information available</Text>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 15,
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  concertInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  tourName: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  setContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  songItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  songName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  withArtistText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  coverArtistText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 100,
  },
});
