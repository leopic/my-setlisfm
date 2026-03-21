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
import { dbOperations } from '../../../src/database/operations';
import type { SetlistWithDetails } from '../../../src/types/database';
import { parseSetlistDate, formatDate } from '../../../src/utils/date';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useColors } from '../../../src/utils/colors';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { ScreenHeader, EmptyState, TabScrollView } from '../../../src/components/ui';

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
  const colors = useColors();
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
        sortContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 20,
          marginBottom: 15,
          paddingHorizontal: 20,
          backgroundColor: colors.backgroundCard,
          paddingVertical: 20,
        },
        sortLabel: {
          fontSize: 14,
          color: colors.textSecondary,
          marginRight: 10,
        },
        sortButtons: {
          flexDirection: 'row',
          backgroundColor: colors.backgroundPill,
          borderRadius: 20,
          borderCurve: 'continuous' as const,
          padding: 5,
        },
        sortButton: {
          paddingVertical: 8,
          paddingHorizontal: 15,
          borderRadius: 15,
          borderCurve: 'continuous' as const,
        },
        sortButtonActive: {
          backgroundColor: colors.primary,
        },
        sortButtonText: {
          fontSize: 14,
          color: colors.textPrimary,
          fontWeight: '600',
        },
        sortButtonTextActive: {
          color: colors.textInverse,
        },
        searchContainer: {
          paddingHorizontal: 20,
          paddingBottom: 10,
        },
        searchInput: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 10,
          borderCurve: 'continuous' as const,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 15,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
        },
        alphabeticalContainer: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          padding: 20,
          marginBottom: 15,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        yearGroup: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          padding: 20,
          marginBottom: 15,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        yearHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        },
        yearTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.textPrimary,
          fontVariant: ['tabular-nums'] as const,
        },
        yearStats: {
          fontSize: 14,
          color: colors.textSecondary,
          fontVariant: ['tabular-nums'] as const,
        },
        monthlyStats: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          marginBottom: 15,
        },
        monthStat: {
          alignItems: 'center',
          marginHorizontal: 10,
          marginBottom: 10,
        },
        monthName: {
          fontSize: 14,
          color: colors.textTertiary,
          marginBottom: 5,
        },
        monthCount: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.primary,
          fontVariant: ['tabular-nums'] as const,
        },
        concertItem: {
          backgroundColor: colors.backgroundPill,
          borderRadius: 10,
          borderCurve: 'continuous' as const,
          padding: 15,
          marginBottom: 10,
        },
        concertHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 5,
        },
        concertMainInfo: {
          flex: 1,
          marginRight: 10,
        },
        artistName: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.textPrimary,
          flexWrap: 'wrap',
        },
        concertDate: {
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        concertDetails: {
          marginTop: 5,
        },
        venueName: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.textTertiary,
        },
        locationText: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        tourName: {
          fontSize: 14,
          color: colors.primary,
          fontWeight: '500',
          marginTop: 5,
        },
        filterContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundDisabled,
          borderRadius: 20,
          borderCurve: 'continuous' as const,
          paddingVertical: 5,
          paddingHorizontal: 10,
          marginTop: 10,
          marginBottom: 15,
        },
        filterBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary,
          borderRadius: 15,
          borderCurve: 'continuous' as const,
          paddingVertical: 5,
          paddingHorizontal: 10,
          marginRight: 10,
        },
        filterLabel: {
          fontSize: 12,
          color: colors.textInverse,
          fontWeight: 'bold',
        },
        filterValue: {
          fontSize: 12,
          color: colors.textInverse,
          fontWeight: 'bold',
        },
        clearFilterButton: {
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 15,
          borderCurve: 'continuous' as const,
          backgroundColor: colors.backgroundPill,
        },
        clearFilterText: {
          fontSize: 12,
          color: colors.textPrimary,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const router = useRouter();
  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConcerts();
  }, []);

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
      <ScreenHeader
        title={t('concerts.title')}
        subtitle={
          sortOption === 'alphabetical'
            ? t('concerts.subtitleAlphabetical', { count: totalConcerts })
            : t('concerts.subtitleByYear', { count: totalConcerts })
        }
      />

      {/* Sorting Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>{t('concerts.sortBy')}</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]}
            onPress={() => handleSortChange('recent')}
            accessibilityRole="button"
            accessibilityState={{ selected: sortOption === 'recent' }}
            accessibilityLabel={t('concerts.sortByMostRecent')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'recent' && styles.sortButtonTextActive,
              ]}
            >
              {t('concerts.mostRecent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'alphabetical' && styles.sortButtonActive]}
            onPress={() => handleSortChange('alphabetical')}
            accessibilityRole="button"
            accessibilityState={{ selected: sortOption === 'alphabetical' }}
            accessibilityLabel={t('concerts.sortByAlphabetical')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'alphabetical' && styles.sortButtonTextActive,
              ]}
            >
              {t('concerts.alphabetical')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
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

      {/* Concerts List */}
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
          // Flat list for alphabetical sorting with proper container spacing
          <View style={styles.alphabeticalContainer}>
            {filteredYearGroups
              .flatMap((yearGroup) => yearGroup.concerts)
              .sort((a, b) => a.artistName.localeCompare(b.artistName))
              .map((concert) => (
                <TouchableOpacity
                  key={concert.id}
                  style={styles.concertItem}
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
                  <View style={styles.concertHeader}>
                    <View style={styles.concertMainInfo}>
                      <Text style={styles.artistName}>{concert.artistName}</Text>
                    </View>
                    <Text style={styles.concertDate}>{formatDate(concert.eventDate ?? '')}</Text>
                  </View>

                  <View style={styles.concertDetails}>
                    <Text style={styles.venueName}>{concert.venueName}</Text>
                    {concert.cityName && (
                      <Text style={styles.locationText}>
                        {concert.cityName}
                        {concert.stateName && `, ${concert.stateName}`}
                        {concert.countryName && `, ${concert.countryName}`}
                      </Text>
                    )}
                  </View>

                  {concert.tour?.name && <Text style={styles.tourName}>{concert.tour.name}</Text>}
                </TouchableOpacity>
              ))}
          </View>
        ) : (
          // Year grouping for recent sorting
          filteredYearGroups.map((yearGroup) => (
            <View key={yearGroup.year} style={styles.yearGroup}>
              {/* Year Header with Stats */}
              <View style={styles.yearHeader}>
                <Text style={styles.yearTitle}>{yearGroup.year}</Text>
                <Text style={styles.yearStats}>
                  {t('common.concert', { count: yearGroup.totalConcerts })}
                </Text>
              </View>

              {/* Monthly Breakdown */}
              <View style={styles.monthlyStats}>
                {Object.entries(yearGroup.monthStats)
                  .sort((a, b) => {
                    const months = [
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ];
                    return months.indexOf(a[0]) - months.indexOf(b[0]);
                  })
                  .map(([month, count]) => (
                    <View key={month} style={styles.monthStat}>
                      <Text style={styles.monthName}>{month}</Text>
                      <Text style={styles.monthCount}>{count}</Text>
                    </View>
                  ))}
              </View>

              {/* Concerts in this year */}
              {yearGroup.concerts.map((concert) => (
                <TouchableOpacity
                  key={concert.id}
                  style={styles.concertItem}
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
                  <View style={styles.concertHeader}>
                    <View style={styles.concertMainInfo}>
                      <Text style={styles.artistName}>{concert.artistName}</Text>
                    </View>
                    <Text style={styles.concertDate}>{formatDate(concert.eventDate ?? '')}</Text>
                  </View>

                  <View style={styles.concertDetails}>
                    <Text style={styles.venueName}>{concert.venueName}</Text>
                    {concert.cityName && (
                      <Text style={styles.locationText}>
                        {concert.cityName}
                        {concert.stateName && `, ${concert.stateName}`}
                        {concert.countryName && `, ${concert.countryName}`}
                      </Text>
                    )}
                  </View>

                  {concert.tour?.name && <Text style={styles.tourName}>{concert.tour.name}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </TabScrollView>
    </SafeAreaView>
  );
}
