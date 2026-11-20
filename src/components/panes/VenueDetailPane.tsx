import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import type { SetlistWithDetails } from '@/types/database';
import { parseSetlistDate, formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { Space } from '@/utils/spacing';
import { RIVER_DOT_TOP } from '@/components/river';

interface YearGroup {
  year: string;
  concerts: SetlistWithDetails[];
}

interface VenueInfo {
  id: string;
  name: string;
  cityName?: string;
  countryName?: string;
}

// One list row: a year heading, or a concert under it. Flat so the list can virtualize.
type TimelineRow =
  | { kind: 'year'; key: string; year: string; count: number }
  | { kind: 'concert'; key: string; concert: SetlistWithDetails; isFirst: boolean };

interface Props {
  venue: VenueInfo | null;
}

export default function VenueDetailPane({ venue }: Props) {
  const colors = useChronicleColors();
  const router = useRouter();
  const { t } = useTranslation();

  const [concerts, setConcerts] = useState<SetlistWithDetails[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loading = !!venue?.id && loadedId !== venue.id;

  useEffect(() => {
    const id = venue?.id;
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const rawConcerts = await dbOperations.getSetlistsByVenue(id);
        if (!cancelled) {
          setConcerts(rawConcerts);
          setLoadedId(id);
        }
      } catch (error) {
        console.error('Failed to load venue concerts:', error);
        if (!cancelled) setLoadedId(id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [venue?.id]);

  const yearGroups = ((): YearGroup[] => {
    const groups: Record<string, SetlistWithDetails[]> = {};
    concerts.forEach((c) => {
      if (!c.eventDate) return;
      const year = parseSetlistDate(c.eventDate).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(c);
    });
    return Object.entries(groups)
      .map(([year, cts]) => ({ year, concerts: cts }))
      .sort((a, b) => parseInt(b.year) - parseInt(a.year));
  })();

  const timelineRows: TimelineRow[] = yearGroups.flatMap((yearGroup, yearIndex) => [
    {
      kind: 'year' as const,
      key: `year-${yearGroup.year}`,
      year: yearGroup.year,
      count: yearGroup.concerts.length,
    },
    ...yearGroup.concerts.map((concert, concertIndex) => ({
      kind: 'concert' as const,
      key: `concert-${concert.id}`,
      concert,
      isFirst: yearIndex === 0 && concertIndex === 0,
    })),
  ]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Space.s8,
    },
    placeholderText: { ...Type.body, color: colors.textMuted },
    header: {
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...Type.title1, color: colors.textPrimary },
    headerSubtitle: { ...Type.subheadline, color: colors.textSecondary },
    headerLocation: { ...Type.subheadline, color: colors.textMuted },
    yearSection: { paddingHorizontal: 0, marginTop: Space.s16 },
    yearGhost: {
      ...Type.yearGhost,
      opacity: 0.18,
      color: colors.textPrimary,
      paddingHorizontal: Space.edge,
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
    riverEntry: { paddingVertical: Space.s12, position: 'relative' },
    dot: {
      position: 'absolute',
      left: -26,
      top: RIVER_DOT_TOP,
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: colors.dotInactive,
      borderWidth: 2,
      borderColor: colors.background,
    },
    dotActive: { backgroundColor: colors.dotActive },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    entryContent: { flex: 1, marginRight: Space.s8 },
    entryDate: { ...Type.footnote, color: colors.accent, letterSpacing: 0.8 },
    entryPrimary: { ...Type.headline, color: colors.textPrimary },
    entrySecondary: { ...Type.subheadline, color: colors.textSecondary },
    entryTour: { ...Type.subheadline, color: colors.accent },
    entryChevron: { ...Type.body, color: colors.textDisabled, alignSelf: 'center' },
    bottomPad: { height: 48 },
  });

  if (!venue) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{t('panes.selectVenue')}</Text>
        </View>
      </View>
    );
  }

  const uniqueArtists = new Set(concerts.map((c) => c.artist?.name)).size;
  const subtitle = [
    t('common.visit', { count: concerts.length }),
    uniqueArtists > 1 ? t('common.artist', { count: uniqueArtists }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const venueLocation = [venue.cityName, venue.countryName].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      {/* Venue header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{venue.name}</Text>
        {venueLocation ? <Text style={styles.headerLocation}>{venueLocation}</Text> : null}
        {!loading && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>

      {/* Timeline river */}
      <LegendList
        style={{ flex: 1 }}
        data={timelineRows}
        keyExtractor={(row) => row.key}
        renderItem={({ item: row }) => {
          if (row.kind === 'year') {
            return (
              <View style={styles.yearSection}>
                <Text style={styles.yearGhost}>{row.year}</Text>
                <Text style={styles.yearSubLabel}>{t('common.concert', { count: row.count })}</Text>
              </View>
            );
          }
          const { concert, isFirst } = row;
          const location = [concert.city?.name, concert.city?.state, concert.country?.name]
            .filter(Boolean)
            .join(', ');
          return (
            <View style={styles.spineContainer}>
              <Pressable
                style={({ pressed }) => [styles.riverEntry, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() =>
                  router.push({ pathname: '/(venues)/[id]', params: { id: concert.id } })
                }
                accessibilityRole="button"
              >
                <View style={[styles.dot, isFirst && styles.dotActive]} />
                <View style={styles.entryRow}>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryDate}>{formatDate(concert.eventDate ?? '')}</Text>
                    <Text style={styles.entryPrimary}>
                      {concert.artist?.name ?? t('common.unknownArtist')}
                    </Text>
                    {location ? <Text style={styles.entrySecondary}>{location}</Text> : null}
                    {concert.tour?.name ? (
                      <Text style={styles.entryTour}>{concert.tour.name}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.entryChevron}>›</Text>
                </View>
              </Pressable>
            </View>
          );
        }}
        estimatedItemSize={90}
        recycleItems={false}
        ListFooterComponent={<View style={styles.bottomPad} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
