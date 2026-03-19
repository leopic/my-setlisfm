import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { SetlistWithDetails, SetWithSongs } from '../types/database';
import { formatDate } from '../utils/date';
import { colors } from '../utils/colors';

interface SetlistProps {
  setlist: SetlistWithDetails;
  sets: SetWithSongs[];
  onBackPress: () => void;
}

export default function Setlist({ setlist, sets, onBackPress }: SetlistProps) {
  const getSetTitle = (set: SetWithSongs, index: number): string => {
    if (set.encore) {
      // Count total encore sets
      const encoreSets = sets.filter((s) => s.encore && s.songs && s.songs.length > 0);
      if (encoreSets.length === 1) {
        return 'Encore';
      } else {
        return `Encore ${set.encore}`;
      }
    }
    if (set.name && set.name !== 'Set 1:' && set.name !== 'Set 1') {
      return set.name;
    }
    // If there's only one set or it's the first set, call it "Main Set"
    if (setlist?.sets && setlist.sets.filter((s) => s.songs && s.songs.length > 0).length === 1) {
      return 'Main Set';
    }
    return index === 0 ? 'Main Set' : `Set ${index + 1}`;
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{setlist.artist?.name || 'Unknown Artist'}</Text>
        <Text style={styles.venueText}>{setlist.venue?.name || 'Unknown Venue'}</Text>
        <Text style={styles.locationText}>
          {setlist.city?.name}
          {setlist.city?.state && `, ${setlist.city.state}`}
          {setlist.country?.name && `, ${setlist.country.name}`}
        </Text>
        <Text style={styles.dateText}>{formatDate(setlist.eventDate ?? '', 'long')}</Text>
        {setlist.tour?.name && <Text style={styles.tourText}>{setlist.tour.name}</Text>}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sets */}
        {sets
          .filter((set) => set.songs && set.songs.length > 0)
          .map((set, index) => (
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
                    <Text style={styles.withArtistText}>with {song.withArtistMbid}</Text>
                  )}
                  {song.coverArtistMbid && (
                    <Text style={styles.coverArtistText}>cover of {song.coverArtistMbid}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}

        {/* Empty state if no sets */}
        {sets.filter((set) => set.songs && set.songs.length > 0).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No setlist information available</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 8,
  },
  venueText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  tourText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  setContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  songItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundPill,
  },
  songName: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  withArtistText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  coverArtistText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
