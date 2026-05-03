import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TabScrollView, Icon } from '@/components/ui';
import ArtistImage from '@/components/ArtistImage';
import { useTranslation } from 'react-i18next';
import type { SetlistWithDetails, SetWithSongs } from '@/types/database';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

interface SetlistProps {
  setlist: SetlistWithDetails;
  sets: SetWithSongs[];
  onBackPress?: () => void;
}

export default function Setlist({ setlist, sets, onBackPress }: SetlistProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backBar: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        backBarRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        backButton: {
          ...Type.body,
          color: colors.accent,
        },
        artistName: {
          ...Type.heading,
          color: colors.textPrimary,
          flex: 1,
        },
        hero: {
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        venueName: {
          ...Type.title,
          color: colors.textPrimary,
        },
        locationLine: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        dateLine: {
          ...Type.body,
          color: colors.textMuted,
          marginTop: 2,
        },
        tourName: {
          ...Type.label,
          color: colors.accent,
          letterSpacing: 0.8,
          marginTop: 6,
          textTransform: 'uppercase',
        },
        scrollView: {
          flex: 1,
        },
        sectionHeader: {
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        sectionLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },
        sectionTitle: {
          ...Type.label,
          color: colors.textMuted,
          textTransform: 'uppercase',
        },
        songRow: {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
        },
        songNumber: {
          ...Type.label,
          color: colors.textDisabled,
          width: 24,
          paddingTop: 1,
        },
        songInfo: {
          flex: 1,
        },
        songNameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          flexWrap: 'wrap',
        },
        songName: {
          ...Type.body,
          color: colors.textPrimary,
        },
        withArtistText: {
          ...Type.body,
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginTop: 2,
        },
        coverArtistText: {
          ...Type.body,
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginTop: 2,
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
      }),
    [colors],
  );

  const getSetTitle = (set: SetWithSongs, index: number): string => {
    if (set.encore) {
      // Count total encore sets
      const encoreSets = sets.filter((s) => s.encore && s.songs && s.songs.length > 0);
      if (encoreSets.length === 1) {
        return t('setlist.encore');
      } else {
        return t('setlist.encoreNumber', { number: set.encore });
      }
    }
    if (set.name && set.name !== 'Set 1:' && set.name !== 'Set 1') {
      return set.name;
    }
    // If there's only one set or it's the first set, call it "Main Set"
    if (setlist?.sets && setlist.sets.filter((s) => s.songs && s.songs.length > 0).length === 1) {
      return t('setlist.mainSet');
    }
    return index === 0 ? t('setlist.mainSet') : t('setlist.setNumber', { number: index + 1 });
  };

  const activeSets = sets.filter((set) => set.songs && set.songs.length > 0);

  const locationParts = [setlist.city?.name, setlist.city?.state, setlist.country?.name].filter(
    Boolean,
  );

  return (
    <>
      {/* Back bar — hidden when used as an inline pane */}
      <View style={styles.backBar}>
        <View style={styles.backBarRow}>
          {onBackPress && (
            <Pressable
              onPress={onBackPress}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backButton}>{'← Back'}</Text>
            </Pressable>
          )}
          {setlist.artist?.mbid && (
            <ArtistImage mbid={setlist.artist.mbid} size={28} name={setlist.artist.name} />
          )}
          <Text style={styles.artistName} numberOfLines={1}>
            {setlist.artist?.name || 'Unknown Artist'}
          </Text>
        </View>
      </View>

      {/* Hero block */}
      <View style={styles.hero}>
        <Text style={styles.venueName}>{setlist.venue?.name || 'Unknown Venue'}</Text>
        {locationParts.length > 0 && (
          <Text style={styles.locationLine}>{locationParts.join(', ')}</Text>
        )}
        <Text style={styles.dateLine}>{formatDate(setlist.eventDate ?? '', 'long')}</Text>
        {setlist.tour?.name && <Text style={styles.tourName}>{setlist.tour.name}</Text>}
      </View>

      {/* Sets */}
      <TabScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeSets.map((set, index) => (
          <View key={set.id}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>{getSetTitle(set, index)}</Text>
              <View style={styles.sectionLine} />
            </View>
            {set.songs?.map((song, songIndex) => (
              <View key={songIndex} style={styles.songRow}>
                <Text style={styles.songNumber}>{String(songIndex + 1).padStart(2, '0')}</Text>
                <View style={styles.songInfo}>
                  <View style={styles.songNameRow}>
                    {song.tape && (
                      <Icon
                        sf="recordingtape"
                        md="radio-outline"
                        size={13}
                        color={colors.textMuted}
                      />
                    )}
                    <Text style={styles.songName}>
                      {song.name}
                      {song.info && ` (${song.info})`}
                    </Text>
                  </View>
                  {song.withArtist?.name && (
                    <Text style={styles.withArtistText}>
                      {t('setlist.withArtist', { name: song.withArtist.name })}
                    </Text>
                  )}
                  {song.coverArtist?.name && (
                    <Text style={styles.coverArtistText}>
                      {t('setlist.coverOf', { name: song.coverArtist.name })}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Empty state */}
        {activeSets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('setlist.noInfo')}</Text>
          </View>
        )}
      </TabScrollView>
    </>
  );
}
