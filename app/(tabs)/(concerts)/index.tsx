import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import type { SetlistWithDetails } from '@/types/database';
import { parseSetlistDate, formatDate } from '@/utils/date';
import type { SortOption } from '@/utils/sort';
import { sortByOption } from '@/utils/sort';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useSyncContext } from '@/contexts/SyncContext';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import { EmptyState, Icon, TabScrollView } from '@/components/ui';

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
  monthStats: { [month: string]: number };
  totalConcerts: number;
}

export default function ConcertsScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollView: {
          flex: 1,
        },
        // ── Header ──────────────────────────────────────────────────────────
        header: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
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
        // ── Search bar ──────────────────────────────────────────────────────
        searchContainer: {
          paddingHorizontal: 16,
          paddingBottom: 10,
        },
        searchInputWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 10,
          paddingVertical: 12,
        },
        searchPrefix: {
          ...Type.body,
          color: colors.textMuted,
          marginRight: 6,
        },
        searchInput: {
          flex: 1,
          ...Type.body,
          color: colors.textPrimary,
          padding: 0,
          margin: 0,
        },
        // ── Sort pills ──────────────────────────────────────────────────────
        sortContainer: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingBottom: 8,
          gap: 8,
        },
        sortPill: {
          paddingVertical: 6,
          paddingHorizontal: 14,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'transparent',
        },
        sortPillActive: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
        sortPillText: {
          ...Type.label,
          color: colors.textMuted,
        },
        sortPillTextActive: {
          color: colors.accent,
        },
        // ── Timeline river ──────────────────────────────────────────────────
        yearSection: {
          paddingHorizontal: 16,
          paddingTop: 12,
        },
        yearGhost: {
          ...Type.display,
          fontSize: 56,
          opacity: 0.18,
          color: colors.textPrimary,
          letterSpacing: -2,
          lineHeight: 56,
          marginTop: -4,
        },
        yearSubLabel: {
          ...Type.label,
          color: colors.textMuted,
          marginBottom: 8,
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
          left: -25.5,
          top: 16,
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
        entryArtist: {
          ...Type.title,
          color: colors.textPrimary,
        },
        entryVenue: {
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
        },
        // ── Alphabetical list ────────────────────────────────────────────────
        alphabeticalEntry: {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        alphabeticalEntryRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        },
        alphabeticalEntryContent: {
          flex: 1,
          marginRight: 8,
        },
      }),
    [colors],
  );

  const { lastSyncTimestamp } = useSyncContext();
  const router = useRouter();
  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConcerts();
  }, [lastSyncTimestamp]);

  const loadConcerts = async () => {
    try {
      setLoading(true);
      const rawConcerts = await dbOperations.getAllSetlists();

      // Transform and add display names
      const concertsWithDetails: ConcertWithDetails[] = rawConcerts.map((concert) => ({
        ...concert,
        artistName: concert.artist?.name || 'Unknown Artist',
        venueName: concert.venue?.name || 'Unknown Venue',
        cityName: concert.city?.name,
        stateName: concert.city?.state,
        countryName: concert.country?.name,
      }));

      const sortedConcerts = sortConcerts(concertsWithDetails, sortOption);
      setConcerts(sortedConcerts);

      // Group by year
      const grouped = groupConcertsByYear(sortedConcerts);
      setYearGroups(grouped);
    } catch (error) {
      console.error('Failed to load concerts:', error);
      Alert.alert(t('common.error'), t('concerts.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const groupConcertsByYear = (concertsToGroup: ConcertWithDetails[]): YearGroup[] => {
    const groups: { [year: string]: ConcertWithDetails[] } = {};

    concertsToGroup.forEach((concert) => {
      if (!concert.eventDate) return;

      const date = parseSetlistDate(concert.eventDate);
      const year = date.getFullYear().toString();

      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(concert);
    });

    // Convert to array and sort by year (descending)
    return Object.entries(groups)
      .map(([year, concerts]) => {
        // Sort concerts within year by date (most recent first)
        const sortedConcerts = concerts.sort((a, b) => {
          if (!a.eventDate || !b.eventDate) return 0;
          const dateA = parseSetlistDate(a.eventDate);
          const dateB = parseSetlistDate(b.eventDate);
          return dateB.getTime() - dateA.getTime();
        });

        // Calculate monthly statistics
        const monthStats: { [month: string]: number } = {};
        sortedConcerts.forEach((concert) => {
          if (concert.eventDate) {
            const date = parseSetlistDate(concert.eventDate);
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            monthStats[month] = (monthStats[month] || 0) + 1;
          }
        });

        return {
          year,
          concerts: sortedConcerts,
          monthStats,
          totalConcerts: concerts.length,
        };
      })
      .sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Sort years descending
  };

  const sortConcerts = (
    concertsToSort: ConcertWithDetails[],
    sortBy: SortOption,
  ): ConcertWithDetails[] => {
    if (sortBy === 'alphabetical') {
      return [...concertsToSort].sort((a, b) => a.artistName.localeCompare(b.artistName));
    }
    return sortByOption(concertsToSort, sortBy, (c) => c.eventDate);
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedConcerts = sortConcerts(concerts, newSortOption);
    setConcerts(sortedConcerts);

    // Re-group the sorted concerts
    const grouped = groupConcertsByYear(sortedConcerts);
    setYearGroups(grouped);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConcerts();
    setRefreshing(false);
  };

  const filteredYearGroups = useMemo(() => {
    if (!searchQuery.trim()) return yearGroups;
    const q = searchQuery.toLowerCase();
    return yearGroups
      .map((group) => ({
        ...group,
        concerts: group.concerts.filter(
          (c) =>
            c.artistName.toLowerCase().includes(q) ||
            c.venueName.toLowerCase().includes(q) ||
            (c.cityName && c.cityName.toLowerCase().includes(q)) ||
            (c.countryName && c.countryName.toLowerCase().includes(q)),
        ),
      }))
      .filter((group) => group.concerts.length > 0);
  }, [yearGroups, searchQuery]);

  const totalConcerts = yearGroups.reduce((sum, group) => sum + group.totalConcerts, 0);

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="concerts-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('concerts.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {sortOption === 'alphabetical'
            ? t('concerts.subtitleAlphabetical', { count: totalConcerts })
            : t('concerts.subtitleByYear', { count: totalConcerts })}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon
            sf="magnifyingglass"
            md="search-outline"
            size={15}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('concerts.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel={t('concerts.searchPlaceholder')}
          />
        </View>
      </View>

      {/* Sort pills */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortPill, sortOption === 'recent' && styles.sortPillActive]}
          onPress={() => handleSortChange('recent')}
          accessibilityRole="button"
          accessibilityState={{ selected: sortOption === 'recent' }}
          accessibilityLabel={t('concerts.sortByMostRecent')}
        >
          <Text style={[styles.sortPillText, sortOption === 'recent' && styles.sortPillTextActive]}>
            {t('concerts.mostRecent')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortPill, sortOption === 'alphabetical' && styles.sortPillActive]}
          onPress={() => handleSortChange('alphabetical')}
          accessibilityRole="button"
          accessibilityState={{ selected: sortOption === 'alphabetical' }}
          accessibilityLabel={t('concerts.sortByAlphabetical')}
        >
          <Text
            style={[
              styles.sortPillText,
              sortOption === 'alphabetical' && styles.sortPillTextActive,
            ]}
          >
            {t('concerts.alphabetical')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Concerts list */}
      <TabScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredYearGroups.length === 0 ? (
          <EmptyState
            title={searchQuery.trim() ? t('common.noMatchesFound') : t('concerts.empty')}
            subtitle={searchQuery.trim() ? t('common.tryDifferentSearch') : undefined}
          />
        ) : sortOption === 'alphabetical' ? (
          // Flat alphabetical list
          <View>
            {filteredYearGroups
              .flatMap((yearGroup) => yearGroup.concerts)
              .sort((a, b) => a.artistName.localeCompare(b.artistName))
              .map((concert) => (
                <TouchableOpacity
                  key={concert.id}
                  style={styles.alphabeticalEntry}
                  testID={`concert-${concert.id}`}
                  onPress={() => {
                    router.push({
                      pathname: '/(concerts)/[id]',
                      params: { id: concert.id },
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${concert.artistName}, ${concert.venueName}, ${formatDate(concert.eventDate ?? '')}`}
                  accessibilityHint={t('concerts.viewConcertDetails')}
                >
                  <View style={styles.alphabeticalEntryRow}>
                    <View style={styles.alphabeticalEntryContent}>
                      <Text style={styles.entryDate}>{formatDate(concert.eventDate ?? '')}</Text>
                      <Text style={styles.entryArtist}>{concert.artistName}</Text>
                      <Text style={styles.entryVenue}>
                        {concert.venueName}
                        {concert.cityName ? ` · ${concert.cityName}` : ''}
                      </Text>
                      {concert.tour?.name && (
                        <Text style={styles.entryTour}>{concert.tour.name}</Text>
                      )}
                    </View>
                    <Text style={styles.entryChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ) : (
          // Timeline river grouped by year
          filteredYearGroups.map((yearGroup, yearIndex) => (
            <View key={yearGroup.year} style={styles.yearSection}>
              {/* Year ghost + sub-label */}
              <Text style={styles.yearGhost}>{yearGroup.year}</Text>
              <Text style={styles.yearSubLabel}>
                {t('common.concert', { count: yearGroup.totalConcerts })}
              </Text>

              {/* Spine + concert entries */}
              <View style={styles.spineContainer}>
                {yearGroup.concerts.map((concert, concertIndex) => {
                  const isFirstOfMostRecentYear = yearIndex === 0 && concertIndex === 0;
                  return (
                    <TouchableOpacity
                      key={concert.id}
                      style={styles.riverEntry}
                      testID={`concert-${concert.id}`}
                      onPress={() => {
                        router.push({
                          pathname: '/(concerts)/[id]',
                          params: { id: concert.id },
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${concert.artistName}, ${concert.venueName}, ${formatDate(concert.eventDate ?? '')}`}
                      accessibilityHint={t('concerts.viewConcertDetails')}
                    >
                      {/* Timeline dot */}
                      <View style={[styles.dot, isFirstOfMostRecentYear && styles.dotActive]} />

                      <View style={styles.entryRow}>
                        <View style={styles.entryContent}>
                          <Text style={styles.entryDate}>
                            {formatDate(concert.eventDate ?? '')}
                          </Text>
                          <Text style={styles.entryArtist}>{concert.artistName}</Text>
                          <Text style={styles.entryVenue}>
                            {concert.venueName}
                            {concert.cityName ? ` · ${concert.cityName}` : ''}
                          </Text>
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
