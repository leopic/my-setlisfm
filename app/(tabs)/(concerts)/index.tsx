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
import { LegendList } from '@legendapp/list';
import { dbOperations } from '@/database/operations';
import type { SetlistWithDetails } from '@/types/database';
import { parseSetlistDate, formatDate } from '@/utils/date';
import type { SortOption } from '@/utils/sort';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useSyncContext } from '@/contexts/SyncContext';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import { EmptyState, Icon } from '@/components/ui';
import SetlistDetailPane from '@/components/panes/SetlistDetailPane';
import { useTabletLayout } from '@/utils/tablet';

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

type ConcertListItem =
  | { type: 'year'; yearGroup: YearGroup; yearIndex: number }
  | { type: 'concert'; concert: ConcertWithDetails };

const CONTENT_PADDING_BOTTOM = 100;

export default function ConcertsScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const { isTablet, sidebarWidth } = useTabletLayout();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        // ── Header ──────────────────────────────────────────────────────────
        header: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
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
        // ── Controls (pinned above list) ────────────────────────────────────
        controls: {
          backgroundColor: colors.background,
          paddingTop: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
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
        searchInput: {
          flex: 1,
          ...Type.body,
          color: colors.textPrimary,
          padding: 0,
          margin: 0,
        },
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
        // ── Tablet master-detail ─────────────────────────────────────────────
        masterDetail: { flex: 1, flexDirection: 'row' },
        sidebar: { borderRightWidth: 1, borderRightColor: colors.border },
        detailPane: { flex: 1 },
        riverEntrySelected: { backgroundColor: colors.accentSoft },
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
  const [selectedConcertId, setSelectedConcertId] = useState<string | null>(null);

  useEffect(() => {
    loadConcerts();
  }, [lastSyncTimestamp]);

  const loadConcerts = async () => {
    try {
      setLoading(true);
      const rawConcerts = await dbOperations.getAllSetlists();

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
      setYearGroups(groupConcertsByYear(sortedConcerts));
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
      const year = parseSetlistDate(concert.eventDate).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(concert);
    });

    return Object.entries(groups)
      .map(([year, cts]) => {
        const sortedConcerts = cts.sort((a, b) => {
          if (!a.eventDate || !b.eventDate) return 0;
          return parseSetlistDate(b.eventDate).getTime() - parseSetlistDate(a.eventDate).getTime();
        });

        const monthStats: { [month: string]: number } = {};
        sortedConcerts.forEach((concert) => {
          if (concert.eventDate) {
            const month = parseSetlistDate(concert.eventDate).toLocaleDateString('en-US', {
              month: 'long',
            });
            monthStats[month] = (monthStats[month] || 0) + 1;
          }
        });

        return { year, concerts: sortedConcerts, monthStats, totalConcerts: cts.length };
      })
      .sort((a, b) => parseInt(b.year) - parseInt(a.year));
  };

  const sortConcerts = (
    concertsToSort: ConcertWithDetails[],
    sortBy: SortOption,
  ): ConcertWithDetails[] => {
    if (sortBy === 'alphabetical') {
      return [...concertsToSort].sort((a, b) => a.artistName.localeCompare(b.artistName));
    }
    return [...concertsToSort].sort((a, b) => {
      if (!a.eventDate || !b.eventDate) return 0;
      return parseSetlistDate(b.eventDate).getTime() - parseSetlistDate(a.eventDate).getTime();
    });
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedConcerts = sortConcerts(concerts, newSortOption);
    setConcerts(sortedConcerts);
    setYearGroups(groupConcertsByYear(sortedConcerts));
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

  const listData = useMemo((): ConcertListItem[] => {
    if (sortOption === 'alphabetical') {
      return filteredYearGroups
        .flatMap((g) => g.concerts)
        .sort((a, b) => a.artistName.localeCompare(b.artistName))
        .map((concert) => ({ type: 'concert' as const, concert }));
    }
    return filteredYearGroups.map((yearGroup, yearIndex) => ({
      type: 'year' as const,
      yearGroup,
      yearIndex,
    }));
  }, [filteredYearGroups, sortOption]);

  const totalConcerts = yearGroups.reduce((sum, g) => sum + g.totalConcerts, 0);

  const handleConcertPress = (concert: ConcertWithDetails) => {
    if (isTablet) {
      setSelectedConcertId(concert.id);
    } else {
      router.push({ pathname: '/(concerts)/[id]', params: { id: concert.id } });
    }
  };

  const renderYearGroup = (yearGroup: YearGroup, yearIndex: number) => (
    <View style={styles.yearSection}>
      <Text style={styles.yearGhost}>{yearGroup.year}</Text>
      <Text style={styles.yearSubLabel}>
        {t('common.concert', { count: yearGroup.totalConcerts })}
      </Text>
      <View style={styles.spineContainer}>
        {yearGroup.concerts.map((concert, concertIndex) => {
          const isFirstOfMostRecentYear = yearIndex === 0 && concertIndex === 0;
          const isSelected = isTablet && selectedConcertId === concert.id;
          return (
            <TouchableOpacity
              key={concert.id}
              style={[styles.riverEntry, isSelected && styles.riverEntrySelected]}
              testID={`concert-${concert.id}`}
              onPress={() => handleConcertPress(concert)}
              accessibilityRole="button"
              accessibilityLabel={`${concert.artistName}, ${concert.venueName}, ${formatDate(concert.eventDate ?? '')}`}
              accessibilityHint={t('concerts.viewConcertDetails')}
            >
              <View style={[styles.dot, isFirstOfMostRecentYear && styles.dotActive]} />
              <View style={styles.entryRow}>
                <View style={styles.entryContent}>
                  <Text style={styles.entryDate}>{formatDate(concert.eventDate ?? '')}</Text>
                  <Text style={styles.entryArtist}>{concert.artistName}</Text>
                  <Text style={styles.entryVenue}>
                    {concert.venueName}
                    {concert.cityName ? ` · ${concert.cityName}` : ''}
                  </Text>
                  {concert.tour?.name && <Text style={styles.entryTour}>{concert.tour.name}</Text>}
                </View>
                <Text style={styles.entryChevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderFlatConcert = (concert: ConcertWithDetails) => {
    const isSelected = isTablet && selectedConcertId === concert.id;
    return (
      <TouchableOpacity
        style={[styles.alphabeticalEntry, isSelected && styles.riverEntrySelected]}
        testID={`concert-${concert.id}`}
        onPress={() => handleConcertPress(concert)}
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
            {concert.tour?.name && <Text style={styles.entryTour}>{concert.tour.name}</Text>}
          </View>
          <Text style={styles.entryChevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ConcertListItem }) => {
    if (item.type === 'year') return renderYearGroup(item.yearGroup, item.yearIndex);
    return renderFlatConcert(item.concert);
  };

  const keyExtractor = (item: ConcertListItem) => {
    if (item.type === 'year') return `year-${item.yearGroup.year}`;
    return `concert-${item.concert.id}`;
  };

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  // No concerts at all — hide controls, show full-page empty state
  if (concerts.length === 0) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="concerts-screen"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('concerts.title')}</Text>
        </View>
        <EmptyState
          icon={{ sf: 'music.note.list', md: 'musical-notes-outline' }}
          title={t('concerts.empty')}
          body={t('concerts.emptyBody')}
        />
      </SafeAreaView>
    );
  }

  const concertList = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('concerts.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {sortOption === 'alphabetical'
            ? t('concerts.subtitleAlphabetical', { count: totalConcerts })
            : t('concerts.subtitleByYear', { count: totalConcerts })}
        </Text>
      </View>

      {/* Search + sort */}
      <View style={styles.controls}>
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
        <View style={styles.sortContainer}>
          {(['recent', 'alphabetical'] as SortOption[]).map((option) => {
            const isActive = sortOption === option;
            const label =
              option === 'recent' ? t('concerts.mostRecent') : t('concerts.alphabetical');
            return (
              <TouchableOpacity
                key={option}
                style={[styles.sortPill, isActive && styles.sortPillActive]}
                onPress={() => handleSortChange(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={label}
              >
                <Text style={[styles.sortPillText, isActive && styles.sortPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <LegendList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: CONTENT_PADDING_BOTTOM }}
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={sortOption === 'alphabetical' ? 72 : 300}
        ListHeaderComponent={null}
        ListEmptyComponent={
          <EmptyState
            title={searchQuery.trim() ? t('common.noMatchesFound') : t('concerts.empty')}
            subtitle={searchQuery.trim() ? t('common.tryDifferentSearch') : undefined}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </>
  );

  if (isTablet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="concerts-screen"
      >
        <View style={styles.masterDetail}>
          <View style={[styles.sidebar, { width: sidebarWidth }]}>{concertList}</View>
          <View style={styles.detailPane}>
            <SetlistDetailPane concertId={selectedConcertId} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="concerts-screen"
    >
      {concertList}
    </SafeAreaView>
  );
}
