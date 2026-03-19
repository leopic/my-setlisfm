import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import SortAndSearch from '../../../src/components/SortAndSearch';
import { formatDate } from '../../../src/utils/date';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { colors } from '../../../src/utils/colors';

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
  const [sortOption, setSortOption] = useState<SortOption>('recent');

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

      const sortedArtists = sortByOption(
        artistsWithStats,
        sortOption,
        undefined,
        (a) => a.concertCount,
      );
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
    router.push({
      pathname: '/artists/concerts',
      params: { artist: artist.mbid },
    });
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedArtists = sortByOption(artists, newSortOption, undefined, (a) => a.concertCount);
    setArtists(sortedArtists);
  };

  const filterArtists = () => {
    if (!searchQuery.trim()) {
      setFilteredArtists(artists);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(query) ||
        artist.sortName?.toLowerCase().includes(query) ||
        artist.disambiguation?.toLowerCase().includes(query),
    );

    setFilteredArtists(filtered);
  };

  const getArtistCard = (artist: ArtistWithStats) => (
    <TouchableOpacity
      key={artist.mbid}
      style={styles.artistCard}
      activeOpacity={0.7}
      onPress={() => handleViewConcerts(artist)}
    >
      <View style={styles.artistHeader}>
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artist.name}</Text>
          {artist.disambiguation && (
            <Text style={styles.artistDisambiguation}>{artist.disambiguation}</Text>
          )}
        </View>
        <View style={styles.concertCountBadge}>
          <Text style={styles.concertCountText}>{artist.concertCount}</Text>
          <Text style={styles.concertCountLabel}>visits</Text>
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
    </TouchableOpacity>
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
            : `${artists.length} artists`}
        </Text>
      </View>

      {/* Sorting Controls */}
      <SortAndSearch
        sortOption={sortOption}
        searchQuery={searchQuery}
        onSortChange={handleSortChange}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search artists..."
      />

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
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textSecondary,
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

  artistsList: {
    flex: 1,
    padding: 20,
  },
  artistCard: {
    backgroundColor: colors.backgroundPill,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  artistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  artistInfo: {
    flex: 1,
    marginRight: 15,
  },
  artistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  artistDisambiguation: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  concertCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 60,
  },
  concertCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  concertCountLabel: {
    fontSize: 10,
    color: colors.textInverse,
    opacity: 0.9,
  },
  artistStats: {
    marginTop: 5,
  },
  lastConcertText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 5,
  },
  venuesText: {
    fontSize: 13,
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
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: colors.textInverse,
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
    color: colors.textSecondary,
  },
});
