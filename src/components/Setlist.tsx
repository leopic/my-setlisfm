import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BackButton, Icon, TabScrollView } from '@/components/ui';
import PhotoChip from '@/components/ui/PhotoChip';
import ArtistGlow from '@/components/ArtistGlow';
import ArtistHero, { useArtistHeroPhoto } from '@/components/ArtistHero';
import { useArtistTint } from '@/utils/useArtistTint';
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
import { Space } from '@/utils/spacing';
import { Radius } from '@/utils/radius';
import { formatPlace } from '@/utils/place';

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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s4 }}>
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

// The round recognition badge in the top bar.
const BADGE_SIZE = 30;

export default function Setlist({ setlist, sets, onBackPress }: SetlistProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  // The artist's photo color replaces the theme accent on this screen.
  const tint = useArtistTint(setlist.artist?.mbid);
  const accent = tint?.accent ?? colors.accent;
  const heroPhoto = useArtistHeroPhoto(setlist.artist?.mbid);

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
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s12,
      // As tall as the 44 pt back button and badge, also in a pane that has neither.
      minHeight: TOUCH_TARGET,
    },
    artistName: {
      ...Type.title1,
      color: colors.textPrimary,
      flex: 1,
    },
    // 44 pt target with the badge inside.
    navBadgeTarget: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -(TOUCH_TARGET - BADGE_SIZE) / 2,
    },
    navBadgeShape: {
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navBadge: {
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: Radius.full,
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
      paddingHorizontal: Space.edge,
      paddingTop: Space.s12,
      paddingBottom: Space.s16,
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
    },
    dateLine: {
      ...Type.subheadline,
      color: colors.textMuted,
    },
    monthStrip: {
      ...Type.footnote,
      color: colors.textDisabled,
      letterSpacing: 1,
      marginTop: Space.s4,
    },
    guestsLine: {
      ...Type.subheadline,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: Space.s4,
    },
    heardText: {
      ...Type.footnote,
      color: accent,
    },
    tourName: {
      ...Type.footnote,
      color: accent,
      letterSpacing: 0.8,
      marginTop: Space.s4,
      textTransform: 'uppercase',
    },
    scrollView: {
      flex: 1,
    },
    sectionHeader: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s20,
      paddingBottom: Space.s4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s12,
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
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Space.s12,
    },
    songNumber: {
      ...Type.footnote,
      color: colors.textDisabled,
      width: 24,
      // Level with the song title's first line.
      paddingTop: (Type.body.lineHeight - Type.footnote.lineHeight) / 2,
    },
    songInfo: {
      flex: 1,
    },
    songNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s4,
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
    },
    coverArtistText: {
      ...Type.subheadline,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Space.s64,
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

  const location = formatPlace(setlist.city?.name, setlist.city?.state, setlist.country?.name);
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
      {/* The color glow under the photo shows for an artist without one. */}
      {tint && <ArtistGlow tint={tint} />}
      {heroPhoto && <ArtistHero photoUrl={heroPhoto} />}
      {/* Back bar — hidden when used as an inline pane */}
      <View style={styles.backBar}>
        <View style={styles.backBarRow}>
          {onBackPress && (
            <BackButton onPress={onBackPress} color={tint?.accent} onPhoto={!!heroPhoto} />
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
              {heroPhoto && !isLandmark ? (
                // Over the photo, the badge matches the back link's chip.
                <PhotoChip style={styles.navBadgeShape} testID="badge-chip">
                  <Icon sf="sparkles" md="sparkles-outline" size={14} color={accent} />
                </PhotoChip>
              ) : (
                <View style={[styles.navBadge, isLandmark && styles.navBadgeLandmark]}>
                  <Icon
                    sf={isLandmark ? 'trophy.fill' : 'sparkles'}
                    md={isLandmark ? 'trophy' : 'sparkles-outline'}
                    size={14}
                    color={isLandmark ? colors.gold : accent}
                  />
                </View>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Hero block */}
      <View style={styles.hero}>
        <Text style={styles.venueName}>{setlist.venue?.name || t('common.unknownVenue')}</Text>
        {location !== '' && <Text style={styles.locationLine}>{location}</Text>}
        <Text style={styles.dateLine}>{eventDate}</Text>
        {setlist.eventDate && (
          // A drawing of the day in its month; the date line above already says it.
          <Text
            style={styles.monthStrip}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {formatMonthStrip(setlist.eventDate)}
          </Text>
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
                // One element for VoiceOver, so the number is read with its song.
                <View key={songIndex} style={styles.songRow} accessible>
                  <Text style={styles.songNumber} accessibilityLabel={String(songIndex + 1)}>
                    {String(songIndex + 1).padStart(2, '0')}
                  </Text>
                  <View style={styles.songInfo}>
                    <View style={styles.songNameRow}>
                      {song.tape && <TapeBadge tape={Number(song.tape)} />}
                      <Text style={styles.songName}>
                        {song.name}
                        {song.info && ` (${song.info})`}
                      </Text>
                      {heard !== undefined && heard > 1 && (
                        <Text
                          style={styles.heardText}
                          accessibilityLabel={t('setlist.heardLabel', { count: heard })}
                        >
                          {t('setlist.heard', { count: heard })}
                        </Text>
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
