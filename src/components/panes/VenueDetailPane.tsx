import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import type { SetlistWithDetails } from '@/types/database';
import { parseSetlistDate, formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

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

interface Props {
  venue: VenueInfo | null;
}

export default function VenueDetailPane({ venue }: Props) {
  const colors = useChronicleColors();
  const router = useRouter();
  const { t } = useTranslation();

  const [concerts, setConcerts] = useState<SetlistWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venue) {
      setConcerts([]);
      return;
    }
    load(venue.id);
  }, [venue?.id]);

  const load = async (id: string) => {
    setLoading(true);
    try {
      const rawConcerts = await dbOperations.getSetlistsByVenue(id);
      setConcerts(rawConcerts);
    } finally {
      setLoading(false);
    }
  };

  const yearGroups = useMemo((): YearGroup[] => {
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
  }, [concerts]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        placeholder: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        placeholderText: { ...Type.body, color: colors.textMuted },
        header: {
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitle: { ...Type.heading, color: colors.textPrimary },
        headerSubtitle: { ...Type.body, color: colors.textSecondary, marginTop: 2 },
        headerLocation: { ...Type.body, color: colors.textMuted, marginTop: 1 },
        yearSection: { paddingHorizontal: 0, marginTop: 16 },
        yearGhost: {
          ...Type.display,
          fontSize: 56,
          opacity: 0.18,
          color: colors.textPrimary,
          letterSpacing: -2,
          lineHeight: 56,
          paddingHorizontal: 20,
        },
        yearSubLabel: {
          ...Type.label,
          color: colors.textMuted,
          paddingHorizontal: 20,
          marginBottom: 4,
        },
        spineContainer: {
          borderLeftWidth: 1.5,
          borderLeftColor: colors.spineColor,
          marginLeft: 36,
          paddingLeft: 20,
        },
        riverEntry: { paddingVertical: 10, position: 'relative' },
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
        dotActive: { backgroundColor: colors.dotActive },
        entryRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        },
        entryContent: { flex: 1, marginRight: 8 },
        entryDate: { ...Type.label, color: colors.accent, letterSpacing: 0.8, marginBottom: 2 },
        entryPrimary: { ...Type.title, color: colors.textPrimary },
        entrySecondary: { ...Type.body, color: colors.textSecondary },
        entryTour: { ...Type.body, color: colors.accent, marginTop: 2 },
        entryChevron: { ...Type.body, color: colors.textDisabled, alignSelf: 'center' },
        bottomPad: { height: 48 },
      }),
    [colors],
  );

  if (!venue) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select a venue</Text>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {yearGroups.map((yearGroup, yearIndex) => (
          <View key={yearGroup.year} style={styles.yearSection}>
            <Text style={styles.yearGhost}>{yearGroup.year}</Text>
            <Text style={styles.yearSubLabel}>
              {t('common.concert', { count: yearGroup.concerts.length })}
            </Text>
            <View style={styles.spineContainer}>
              {yearGroup.concerts.map((concert, concertIndex) => {
                const isFirst = yearIndex === 0 && concertIndex === 0;
                const location = [concert.city?.name, concert.city?.state, concert.country?.name]
                  .filter(Boolean)
                  .join(', ');
                return (
                  <TouchableOpacity
                    key={concert.id}
                    style={styles.riverEntry}
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
                          {concert.artist?.name ?? 'Unknown Artist'}
                        </Text>
                        {location ? <Text style={styles.entrySecondary}>{location}</Text> : null}
                        {concert.tour?.name ? (
                          <Text style={styles.entryTour}>{concert.tour.name}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.entryChevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}
