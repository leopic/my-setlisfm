import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';

type SortOption = 'alphabetical' | 'recent' | 'top';

interface ArtistWithStats {
  mbid: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
  concertCount: number;
  lastConcertDate?: string;
  venues: string[];
}

export default function ArtistsScreen() {
  const router = useRouter();
  const [artists, setArtists] = useState<ArtistWithStats[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<ArtistWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');

  useEffect(() => {
    loadArtists();
  }, []);

  useEffect(() => {
    filterArtists();
  }, [artists, searchQuery]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const artistsWithStats = await dbOperations.getArtistsWithStats();
      const sortedArtists = sortArtists(artistsWithStats, sortOption);
      setArtists(sortedArtists);
    } catch (error) {
      console.error('Failed to load artists:', error);
      Alert.alert('Error', 'Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  const handleViewConcerts = (artist: ArtistWithStats) => {
    // Navigate to concerts list screen
    console.log('🔄 Navigation:', {
      from: '/artists',
      to: '/artists/concerts',
      params: { artist: artist.mbid }
    });
    router.push({
      pathname: '/artists/concerts',
      params: { artist: artist.mbid },
    });
  };

  const sortArtists = (artistsToSort: ArtistWithStats[], sortBy: SortOption): ArtistWithStats[] => {
    switch (sortBy) {
      case 'alphabetical':
        return [...artistsToSort].sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return [...artistsToSort].sort((a, b) => {
          if (!a.lastConcertDate || !b.lastConcertDate) return 0;
          const dateA = parseDateCorrectly(a.lastConcertDate);
          const dateB = parseDateCorrectly(b.lastConcertDate);
          return dateB.getTime() - dateA.getTime();
        });
      case 'top':
        return [...artistsToSort].sort((a, b) => b.concertCount - a.concertCount);
      default:
        return artistsToSort;
    }
  };

  // Parse DD-MM-YYYY format correctly
  const parseDateCorrectly = (dateString: string): Date => {
    try {
      const [day, month, year] = dateString.split('-').map(Number);
      // month - 1 because JavaScript months are 0-indexed
      return new Date(year, month - 1, day);
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date(0); // Return epoch date for invalid dates
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedArtists = sortArtists(artists, newSortOption);
    setArtists(sortedArtists);
  };

  const filterArtists = () => {
    if (!searchQuery.trim()) {
      setFilteredArtists(artists);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = artists.filter(artist => 
      artist.name.toLowerCase().includes(query) ||
      artist.sortName?.toLowerCase().includes(query) ||
      artist.disambiguation?.toLowerCase().includes(query)
    );
    
    setFilteredArtists(filtered);
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

  const getArtistCard = (artist: ArtistWithStats) => (
    <View key={artist.mbid} style={styles.artistCard}>
      <View style={styles.artistHeader}>
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artist.name}</Text>
          {artist.disambiguation && (
            <Text style={styles.artistDisambiguation}>{artist.disambiguation}</Text>
          )}
        </View>
        <View style={styles.concertCountBadge}>
          <Text style={styles.concertCountText}>{artist.concertCount}</Text>
          <Text style={styles.concertCountLabel}>concerts</Text>
        </View>
      </View>
      
      <View style={styles.artistStats}>
        {artist.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            🎵 Last seen: {formatDate(artist.lastConcertDate)}
          </Text>
        )}
        {artist.venues.length > 0 && (
          <Text style={styles.venuesText}>
            📍 Venues: {artist.venues.slice(0, 3).join(', ')}
            {artist.venues.length > 3 && ` +${artist.venues.length - 3} more`}
          </Text>
        )}
      </View>

      <View style={styles.artistActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewConcerts(artist)}
        >
          <Text style={styles.actionButtonText}>View Concerts</Text>
        </TouchableOpacity>
        {artist.url && (
          <TouchableOpacity 
            style={styles.actionButtonSecondary}
            onPress={() => Alert.alert('External Link', `Would open: ${artist.url}`)}
          >
            <Text style={styles.actionButtonTextSecondary}>Setlist.fm</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading artists...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Artists</Text>
        <Text style={styles.subtitle}>
          {sortOption === 'top' 
            ? `${artists.length} artists (sorted by concert count)`
            : `${artists.length} artists`
          }
        </Text>
      </View>

      {/* Sorting Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortOption === 'alphabetical' && styles.sortButtonActive]} 
            onPress={() => handleSortChange('alphabetical')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'alphabetical' && styles.sortButtonTextActive]}>
              Alphabetical
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]} 
            onPress={() => handleSortChange('recent')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'recent' && styles.sortButtonTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortOption === 'top' && styles.sortButtonActive]} 
            onPress={() => handleSortChange('top')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'top' && styles.sortButtonTextActive]}>
              Top
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search artists..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView style={styles.artistsList} showsVerticalScrollIndicator={false}>
        {filteredArtists.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() ? 'No artists match your search' : 'No artists found'}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadArtists}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredArtists.map(getArtistCard)
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
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
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
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  artistsList: {
    flex: 1,
    padding: 20,
  },
  artistCard: {
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
  artistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  artistInfo: {
    flex: 1,
    marginRight: 15,
  },
  artistName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  artistDisambiguation: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  concertCountBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  concertCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  concertCountLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },
  artistStats: {
    marginBottom: 20,
  },
  lastConcertText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 5,
  },
  venuesText: {
    fontSize: 13,
    color: '#666',
  },
  artistActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flex: 1,
  },
  actionButtonTextSecondary: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 2,
  },
  sortButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
});
