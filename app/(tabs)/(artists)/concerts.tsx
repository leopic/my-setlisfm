import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '@/database/operations';
import type { SetlistWithDetails } from '@/types/database';
import { parseSetlistDate, formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import ConcertListSkeleton from '@/components/skeletons/ConcertListSkeleton';
import ArtistImage from '@/components/ArtistImage';
import { TabScrollView } from '@/components/ui';
import { useTranslation } from 'react-i18next';

interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string;
  venueName: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
}

interface YearGroup {
  year: string;
  concerts: ConcertWithDetails[];
}

export default function ArtistConcertsListScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        // ── Inline header ──────────────────────────────────────────────────
        inlineHeader: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        backRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        },
        backButton: {
          // TouchableOpacity wrapper — no extra styles needed
        },
        backText: {
          ...Type.body,
          color: colors.accent,
        },
        artistRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 4,
        },
        artistTextBlock: {
          flex: 1,
        },
        headerTitle: {
          ...Type.heading,
          color: colors.textPrimary,
        },
        headerSubtitle: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        // ── Timeline river ──────────────────────────────────────────────────
        scrollView: {
          flex: 1,
        },
        yearSection: {
          paddingHorizontal: 0,
          marginTop: 16,
        },
        yearGhost: {
          ...Type.display,
          fontSize: 56,
          opacity: 0.18,
          color: colors.textPrimary,
          letterSpacing: -2,
          lineHeight: 56,
          paddingHorizontal: 16,
          marginTop: 0,
        },
        yearSubLabel: {
          ...Type.label,
          color: colors.textMuted,
          paddingHorizontal: 16,
          marginBottom: 4,
        },
        spineContainer: {
          borderLeftWidth: 1.5,
          borderLeftColor: colors.spineColor,
          marginLeft: 28,
          paddingLeft: 20,
        },
        // ── Concert entry (river) ────────────────────────────────────────────
        riverEntry: {
          paddingVertical: 10,
          position: 'relative',
        },
        dot: {
          position: 'absolute',
          left: -26,
          top: 14,
          width: 9,
          height: 9,
          borderRadius: 4.5,
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
          marginRight: 8,
        },
        entryDate: {
          ...Type.label,
          color: colors.accent,
          letterSpacing: 0.8,
          marginBottom: 2,
        },
        entryPrimary: {
          ...Type.title,
          color: colors.textPrimary,
        },
        entrySecondary: {
          ...Type.body,
          color: colors.textSecondary,
        },
        entryTour: {
          ...Type.body,
          color: colors.accent,
          marginTop: 2,
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

  const router = useRouter();
  const params = useLocalSearchParams();

  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [artistName, setArtistName] = useState<string>('');
  const [artistImageUrl, setArtistImageUrl] = useState<string | undefined>(undefined);

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

      // Fetch artist name and image
      const artistData = await dbOperations.getArtistByMbid(mbid);
      if (artistData?.name) {
        setArtistName(artistData.name);
        setArtistImageUrl(artistData.imageUrl ?? undefined);
      }

      // Fetch concerts
      const rawConcerts = await dbOperations.getSetlistsByArtist(mbid);
      const concertsWithDetails = transformConcerts(rawConcerts);
      setConcerts(concertsWithDetails);
    } catch (error) {
      console.error('Failed to load artist concerts:', error);
      Alert.alert(t('common.error'), t('artists.failedToLoadConcerts'));
    } finally {
      setLoading(false);
    }
  };

  const transformConcerts = (rawConcerts: SetlistWithDetails[]): ConcertWithDetails[] => {
    return rawConcerts.map((concert) => ({
      ...concert,
      artistName: concert.artist?.name || 'Unknown Artist',
      venueName: concert.venue?.name || 'Unknown Venue',
      cityName: concert.city?.name,
      stateName: concert.city?.state,
      countryName: concert.country?.name,
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArtistConcerts(artistMbid);
    setRefreshing(false);
  };

  const handleConcertPress = (concert: ConcertWithDetails) => {
    router.push({
      pathname: '/(artists)/[id]',
      params: { id: concert.id },
    });
  };

  const yearGroups = useMemo((): YearGroup[] => {
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
  }, [concerts]);

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.artistRow}>
          <ArtistImage mbid={artistMbid} imageUrl={artistImageUrl} size={56} name={artistName} />
          <View style={styles.artistTextBlock}>
            <Text style={styles.headerTitle}>{artistName}</Text>
            <Text style={styles.headerSubtitle}>{subtitleParts.join(' · ')}</Text>
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
                  const location = [concert.cityName, concert.stateName, concert.countryName]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <TouchableOpacity
                      key={concert.id}
                      style={styles.riverEntry}
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
                        </View>
                        <Text style={styles.entryChevron}>›</Text>
                      </View>
                    </TouchableOpacity>
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
