import { useRef } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LegendList, type LegendListRef } from '@legendapp/list/react-native';
import type { SortOption } from '@/utils/sort';
import { scrollListToTop } from '@/utils/scrollListToTop';
import { EmptyState, tabBarContentStyle } from '@/components/ui';
import VenueControls from './VenueControls';
import VenueGeoStrip from './VenueGeoStrip';
import VenueRow from './VenueRow';
import type { VenueStyles } from './venueStyles';
import type { GeoStats, VenueWithStats } from './types';

type Props = {
  styles: VenueStyles;
  venueCount: number;
  filteredVenues: VenueWithStats[];
  geoStats: GeoStats | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  refreshing: boolean;
  onRefresh: () => void;
  selectedVenueId: string | undefined;
  onPressVenue: (venue: VenueWithStats) => void;
};

export default function VenueListPane({
  styles,
  venueCount,
  filteredVenues,
  geoStats,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  refreshing,
  onRefresh,
  selectedVenueId,
  onPressVenue,
}: Props) {
  const { t } = useTranslation();
  const subtitle =
    sortOption === 'top'
      ? t('venues.subtitleSorted', { count: venueCount })
      : sortOption === 'recent'
        ? t('venues.subtitleRecent', { count: venueCount })
        : t('venues.subtitle', { count: venueCount });

  // Search and sort sit above the list, so new results start at the top, not where the old ones were.
  const listRef = useRef<LegendListRef>(null);
  const handleSortChange = (option: SortOption) => {
    onSortChange(option);
    scrollListToTop(listRef.current);
  };
  const handleSearchChange = (query: string) => {
    onSearchChange(query);
    scrollListToTop(listRef.current);
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('venues.title')}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {/* Geo navigation strip */}
      <VenueGeoStrip styles={styles} geoStats={geoStats} />

      {/* Search + sort */}
      <VenueControls
        styles={styles}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />

      <LegendList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={tabBarContentStyle}
        data={filteredVenues}
        keyExtractor={(item) => item.id}
        renderItem={({ item: venue }) => (
          <VenueRow
            styles={styles}
            venue={venue}
            isSelected={selectedVenueId === venue.id}
            onPress={onPressVenue}
          />
        )}
        estimatedItemSize={80}
        recycleItems={false}
        ListHeaderComponent={null}
        ListEmptyComponent={
          <EmptyState
            variant="inline"
            title={t('venues.noMatch')}
            body={t('common.tryDifferentSearch')}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}
