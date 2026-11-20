import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BackButton, Icon, TabScrollView } from '@/components/ui';
import ArtistImage from '@/components/ArtistImage';
import RecognitionSheet from '@/components/RecognitionSheet';
import { useTranslation } from 'react-i18next';
import type { SetlistWithDetails, SetWithSongs } from '@/types/database';
import { getConcertRecognitionFacts, type ConcertRecognitionFacts } from '@/database/factQueries';
import { isLandmarkVisit } from '@/utils/recognition';
import { dbOperations } from '@/database/operations';
import { formatDate, formatMonthStrip } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';

// Intro and outro tapes, by the song's tape value.
const TAPE_BADGES: Record<
  number,
  {
    sf: React.ComponentProps<typeof Icon>['sf'];
    md: React.ComponentProps<typeof Icon>['md'];
    label: string;
  }
> = {
  1: { sf: 'recordingtape', md: 'radio-outline', label: 'setlist.tape' },
};

function TapeBadge({ tape }: { tape: number }) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const badge = TAPE_BADGES[tape];
  const label = t(badge.label);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon sf={badge.sf} md={badge.md} size={13} color={colors.textMuted} />
      <Text style={{ ...Type.footnote, color: colors.textMuted, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

interface SongPlays {
  setId: number;
  songOrder: number;
  plays: number;
}

interface SetlistProps {
  setlist: SetlistWithDetails;
  sets: SetWithSongs[];
  onBackPress?: () => void;
}

export default function Setlist({ setlist, sets, onBackPress }: SetlistProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();

  // Facts are stored with the setlist id they belong to, so a changed id hides them
  // during render instead of resetting state inside the effect.
  const [loadedFacts, setLoadedFacts] = useState<{
    setlistId: string;
    facts: ConcertRecognitionFacts | null;
  } | null>(null);
  const facts = loadedFacts?.setlistId === setlist.id ? loadedFacts.facts : null;
  const [sheetVisible, setSheetVisible] = useState(false);
  const [songPlays, setSongPlays] = useState<SongPlays[]>([]);

  useEffect(() => {
    if (!setlist.id) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await dbOperations.getSongPlayCounts(setlist.id);
        if (!cancelled) setSongPlays(result);
      } catch (error) {
        console.error('Failed to load song play counts:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setlist.id]);

  useEffect(() => {
    if (!setlist.id) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getConcertRecognitionFacts(setlist.id);
        if (!cancelled) setLoadedFacts({ setlistId: setlist.id, facts: result });
      } catch (error) {
        console.error('Failed to load recognition facts:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setlist.id]);

  const isLandmark = facts ? isLandmarkVisit(facts) : false;

  const styles = StyleSheet.create({
    backBar: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      // As tall as the 44 pt back button and badge, also in a pane that has neither.
      minHeight: TOUCH_TARGET,
    },
    artistName: {
      ...Type.title1,
      color: colors.textPrimary,
      flex: 1,
    },
    // 44 pt target with a 30 pt badge inside.
    navBadgeTarget: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -(TOUCH_TARGET - 30) / 2,
    },
    navBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navBadgeLandmark: {
      backgroundColor: colors.goldSoft,
      borderColor: colors.gold,
    },
    hero: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    venueName: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    locationLine: {
      ...Type.subheadline,
      color: colors.textSecondary,
      marginTop: 2,
    },
    dateLine: {
      ...Type.subheadline,
      color: colors.textMuted,
      marginTop: 2,
    },
    monthStrip: {
      ...Type.footnote,
      color: colors.textDisabled,
      letterSpacing: 1,
      marginTop: 4,
    },
    guestsLine: {
      ...Type.subheadline,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    heardText: {
      ...Type.footnote,
      color: colors.accent,
    },
    tourName: {
      ...Type.footnote,
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
      ...Type.footnote,
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
      ...Type.footnote,
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
      ...Type.subheadline,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    coverArtistText: {
      ...Type.subheadline,
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
  });

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
  const eventDate = formatDate(setlist.eventDate ?? '', 'long');

  // Everyone who joined the band on stage, once each.
  const guestNames = [
    ...new Set(
      activeSets
        .flatMap((set) => set.songs ?? [])
        .flatMap((song) => (song.withArtist ? [song.withArtist] : []))
        .map(({ name = '' }) => name.trim())
        .filter(Boolean),
    ),
  ];

  const playsBySong = new Map(
    songPlays.map((row) => [`${row.setId}:${row.songOrder.toString()}`, row.plays]),
  );

  return (
    <>
      {/* Back bar — hidden when used as an inline pane */}
      <View style={styles.backBar}>
        <View style={styles.backBarRow}>
          {onBackPress && <BackButton onPress={onBackPress} />}
          {setlist.artist?.mbid && (
            <ArtistImage mbid={setlist.artist.mbid} size={28} name={setlist.artist.name} />
          )}
          <Text style={styles.artistName} numberOfLines={1}>
            {setlist.artist?.name || t('common.unknownArtist')}
          </Text>
          {facts && (
            <Pressable
              testID="recognition-badge"
              style={({ pressed }) => [styles.navBadgeTarget, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('recognition.badgeAccessibilityLabel')}
            >
              <View style={[styles.navBadge, isLandmark && styles.navBadgeLandmark]}>
                <Icon
                  sf={isLandmark ? 'trophy.fill' : 'sparkles'}
                  md={isLandmark ? 'trophy' : 'sparkles-outline'}
                  size={14}
                  color={isLandmark ? colors.gold : colors.accent}
                />
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Hero block */}
      <View style={styles.hero}>
        <Text style={styles.venueName}>{setlist.venue?.name || t('common.unknownVenue')}</Text>
        {locationParts.length > 0 && (
          <Text style={styles.locationLine}>{locationParts.join(', ')}</Text>
        )}
        <Text style={styles.dateLine}>{eventDate}</Text>
        {setlist.eventDate && (
          <Text style={styles.monthStrip}>{formatMonthStrip(setlist.eventDate)}</Text>
        )}
        {guestNames.length > 0 && (
          <Text style={styles.guestsLine}>
            {t('setlist.withGuests', { names: guestNames.join(', ') })}
          </Text>
        )}
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
            {set.songs?.map((song, songIndex) => {
              const heard = playsBySong.get(`${song.setId}:${song.songOrder.toString()}`);
              return (
                <View key={songIndex} style={styles.songRow}>
                  <Text style={styles.songNumber}>{String(songIndex + 1).padStart(2, '0')}</Text>
                  <View style={styles.songInfo}>
                    <View style={styles.songNameRow}>
                      {song.tape && <TapeBadge tape={Number(song.tape)} />}
                      <Text style={styles.songName}>
                        {song.name}
                        {song.info && ` (${song.info})`}
                      </Text>
                      {heard !== undefined && heard > 1 && (
                        <Text style={styles.heardText}>{t('setlist.heard', { count: heard })}</Text>
                      )}
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
              );
            })}
          </View>
        ))}

        {/* Empty state */}
        {activeSets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('setlist.noInfo')}</Text>
          </View>
        )}
      </TabScrollView>

      {facts && (
        <RecognitionSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          artistName={setlist.artist?.name || t('common.unknownArtist')}
          currentCityName={setlist.city?.name}
          currentCountryName={setlist.country?.name}
          facts={facts}
          isLandmark={isLandmark}
        />
      )}
    </>
  );
}
