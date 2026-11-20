import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '@/database/operations';
import type { DBArtist, SetlistWithDetails } from '@/types/database';
import { parseSetlistDate, formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import ConcertListSkeleton from '@/components/skeletons/ConcertListSkeleton';
import ArtistImage from '@/components/ArtistImage';
import { BackButton, TabScrollView } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Space } from '@/utils/spacing';
import { RIVER_DOT_TOP } from '@/components/river';
import { Radius } from '@/utils/radius';
import { formatPlace } from '@/utils/place';

interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string;
  venueName: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
}

// The letter the artist is filed under, from setlist.fm's sort name ("Strokes, The" → S).
function indexLetter({ sortName = '' }: DBArtist): string {
  return sortName.charAt(0).toUpperCase();
}

const EDITED_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

// When the setlist was last edited on setlist.fm, e.g. "Jan 2024".
function formatEdited(lastUpdated: string): string {
  // setlist.fm stamps look like 2024-01-15T10:00:00.000+0000.
  const [year, month] = lastUpdated.split('-').map(Number);
  return EDITED_FORMAT.format(new Date(year, month - 1));
}

interface YearGroup {
  year: string;
  concerts: ConcertWithDetails[];
}

function transformConcerts(rawConcerts: SetlistWithDetails[], t: TFunction): ConcertWithDetails[] {
  return rawConcerts.map((concert) => ({
    ...concert,
    artistName: concert.artist?.name || t('common.unknownArtist'),
    venueName: concert.venue?.name || t('common.unknownVenue'),
    cityName: concert.city?.name,
    stateName: concert.city?.state,
    countryName: concert.country?.name,
  }));
}

export default function ArtistConcertsListScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // ── Inline header ──────────────────────────────────────────────────
    inlineHeader: {
      paddingHorizontal: Space.edge,
      // The back button's 44 pt target already adds space above its text.
      paddingTop: Space.s4,
      paddingBottom: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    artistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s12,
      marginTop: Space.s4,
    },
    artistTextBlock: {
      flex: 1,
    },
    headerTitle: {
      ...Type.title1,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    // ── Timeline river ──────────────────────────────────────────────────
    scrollView: {
      flex: 1,
    },
    yearSection: {
      paddingHorizontal: 0,
      marginTop: Space.s16,
    },
    yearGhost: {
      ...Type.yearGhost,
      opacity: 0.18,
      color: colors.textPrimary,
      paddingHorizontal: Space.edge,
      marginTop: 0,
    },
    yearSubLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      paddingHorizontal: Space.edge,
      marginBottom: Space.s4,
    },
    spineContainer: {
      borderLeftWidth: 1.5,
      borderLeftColor: colors.spineColor,
      marginLeft: Space.s32,
      paddingLeft: Space.s20,
    },
    // ── Concert entry (river) ────────────────────────────────────────────
    riverEntry: {
      paddingVertical: Space.s12,
      // Keeps the › arrow off the screen edge; the row stays tappable up to it.
      paddingRight: Space.edge,
      position: 'relative',
    },
    dot: {
      position: 'absolute',
      left: -26,
      top: RIVER_DOT_TOP,
      width: 9,
      height: 9,
      borderRadius: Radius.full,
      backgroundColor: colors.dotInactive,
      borderWidth: 2,
      borderColor: colors.background,
    },
    dotActive: {
      backgroundColor: colors.dotActive,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    entryContent: {
      flex: 1,
      marginRight: Space.s8,
    },
    entryDate: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
    },
    entryPrimary: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    entrySecondary: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    entryTour: {
      ...Type.subheadline,
      color: colors.accent,
    },
    entryChevron: {
      ...Type.body,
      color: colors.textDisabled,
      alignSelf: 'center',
      marginLeft: 'auto',
    },
    // ── Empty state ──────────────────────────────────────────────────────
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Space.s64,
    },
    emptyStateText: {
      ...Type.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const router = useRouter();
  const params = useLocalSearchParams();

  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [artistName, setArtistName] = useState<string>('');
  const [artist, setArtist] = useState<DBArtist | null>(null);
  const [artistImageUrl, setArtistImageUrl] = useState<string | undefined>(undefined);

  // Get artist parameter from navigation
  const artistMbid = params.artist as string;

  useEffect(() => {
    if (!artistMbid) return;
    let cancelled = false;
    (async () => {
      try {
        const artistData = await dbOperations.getArtistByMbid(artistMbid);
        if (cancelled) return;
        setArtist(artistData);
        if (artistData?.name) {
          setArtistName(artistData.name);
          setArtistImageUrl(artistData.imageUrl ?? undefined);
        }
        const rawConcerts = await dbOperations.getSetlistsByArtist(artistMbid);
        if (!cancelled) {
          setConcerts(transformConcerts(rawConcerts, t));
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load artist concerts:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), t('artists.failedToLoadConcerts'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [artistMbid, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const artistData = await dbOperations.getArtistByMbid(artistMbid);
      if (artistData?.name) {
        setArtistName(artistData.name);
        setArtistImageUrl(artistData.imageUrl ?? undefined);
      }
      const rawConcerts = await dbOperations.getSetlistsByArtist(artistMbid);
      setConcerts(transformConcerts(rawConcerts, t));
    } catch (error) {
      console.error('Failed to load artist concerts:', error);
      Alert.alert(t('common.error'), t('artists.failedToLoadConcerts'));
    }
    setRefreshing(false);
  };

  const handleConcertPress = (concert: ConcertWithDetails) => {
    router.push({
      pathname: '/(artists)/[id]',
      params: { id: concert.id },
    });
  };

  const yearGroups = ((): YearGroup[] => {
    const groups: { [year: string]: ConcertWithDetails[] } = {};

    concerts.forEach((concert) => {
      if (!concert.eventDate) return;
      const year = parseSetlistDate(concert.eventDate).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(concert);
    });

    return Object.entries(groups)
      .map(([year, groupConcerts]) => ({ year, concerts: groupConcerts }))
      .sort((a, b) => parseInt(b.year) - parseInt(a.year));
  })();

  if (loading) {
    return <ConcertListSkeleton />;
  }

  const uniqueCities = new Set(concerts.map((c) => c.cityName)).size;
  const uniqueCountries = new Set(concerts.map((c) => c.countryName)).size;
  const subtitleParts = [
    t('common.concert', { count: concerts.length }),
    t('common.city', { count: uniqueCities }),
    t('common.country', { count: uniqueCountries }),
  ];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="artist-concerts-screen"
    >
      {/* Inline header */}
      <View style={styles.inlineHeader}>
        <View style={styles.backRow}>
          <BackButton onPress={() => router.back()} />
        </View>
        <View style={styles.artistRow}>
          <ArtistImage mbid={artistMbid} imageUrl={artistImageUrl} size={56} name={artistName} />
          <View style={styles.artistTextBlock}>
            <Text style={styles.headerTitle}>{artistName}</Text>
            <Text style={styles.headerSubtitle}>{subtitleParts.join(' · ')}</Text>
            {artist && (
              <Text style={styles.headerSubtitle}>
                {t('artists.filedUnder', { letter: indexLetter(artist) })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Concerts list */}
      <TabScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {concerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('artists.noConcertsFound')}</Text>
          </View>
        ) : (
          yearGroups.map((yearGroup, yearIndex) => (
            <View key={yearGroup.year} style={styles.yearSection}>
              {/* Year ghost + count */}
              <Text style={styles.yearGhost}>{yearGroup.year}</Text>
              <Text style={styles.yearSubLabel}>
                {t('common.concert', { count: yearGroup.concerts.length })}
              </Text>

              {/* Spine + concert entries */}
              <View style={styles.spineContainer}>
                {yearGroup.concerts.map((concert, concertIndex) => {
                  const isFirstOfMostRecentYear = yearIndex === 0 && concertIndex === 0;
                  const location = formatPlace(
                    concert.cityName,
                    concert.stateName,
                    concert.countryName,
                  );

                  return (
                    <Pressable
                      key={concert.id}
                      style={({ pressed }) => [styles.riverEntry, { opacity: pressed ? 0.7 : 1 }]}
                      testID={`artist-concert-${concert.id}`}
                      onPress={() => handleConcertPress(concert)}
                      accessibilityRole="button"
                      accessibilityLabel={`${concert.artistName}, ${concert.venueName}, ${formatDate(concert.eventDate ?? '')}`}
                    >
                      {/* Timeline dot */}
                      <View style={[styles.dot, isFirstOfMostRecentYear && styles.dotActive]} />

                      <View style={styles.entryRow}>
                        <View style={styles.entryContent}>
                          <Text style={styles.entryDate}>
                            {formatDate(concert.eventDate ?? '')}
                          </Text>
                          {/* Primary: venue name */}
                          <Text style={styles.entryPrimary}>{concert.venueName}</Text>
                          {/* Secondary: location */}
                          {location ? <Text style={styles.entrySecondary}>{location}</Text> : null}
                          {concert.tour?.name && (
                            <Text style={styles.entryTour}>{concert.tour.name}</Text>
                          )}
                          {concert.lastUpdated && (
                            <Text style={styles.entrySecondary}>
                              {t('artists.setlistEdited', {
                                date: formatEdited(concert.lastUpdated),
                              })}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.entryChevron}>›</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </TabScrollView>
    </SafeAreaView>
  );
}
