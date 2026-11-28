import { useRef } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LegendList, type LegendListRef } from '@legendapp/list/react-native';
import type { SortOption } from '@/utils/sort';
import { scrollListToTop, useListTop } from '@/utils/scrollListToTop';
import { EmptyState, HeaderSearchBar, tabBarContentStyle } from '@/components/ui';
import { searchInHeader } from '@/utils/searchInHeader';
import { sortMenuInHeader } from '@/utils/sortMenuInHeader';
import VenueControls from './VenueControls';
import VenueGeoStrip from './VenueGeoStrip';
import VenueToolbar from './VenueToolbar';
import { geoMenuInHeader } from './geoMenuInHeader';
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
  // Under the screen's native large title (phone): no title of its own, and the subtitle,
  // geo strip and controls scroll with the list.
  underLargeTitle?: boolean;
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
  underLargeTitle = false,
}: Props) {
  const { t } = useTranslation();
  const subtitle =
    sortOption === 'top'
      ? t('venues.subtitleSorted', { count: venueCount })
      : sortOption === 'recent'
        ? t('venues.subtitleRecent', { count: venueCount })
        : t('venues.subtitle', { count: venueCount });

  // Search and sort sit above the list (under a large title, at its top), so new results start
  // at the top, not where the old ones were.
  const listRef = useRef<LegendListRef>(null);
  const listTop = useListTop(listRef);
  const handleSortChange = (option: SortOption) => {
    onSortChange(option);
    scrollListToTop(listRef.current, listTop.top.current);
  };
  const handleSearchChange = (query: string) => {
    onSearchChange(query);
    scrollListToTop(listRef.current, listTop.top.current);
  };

  const geoStripAndControls = (
    <>
      {/* Geo navigation strip (in the header's globe menu on an iPhone) */}
      {!geoMenuInHeader(underLargeTitle) && <VenueGeoStrip styles={styles} geoStats={geoStats} />}

      {/* Search + sort (on an iPhone both are in the native bar) */}
      <VenueControls
        styles={styles}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showSearch={!searchInHeader(underLargeTitle)}
        showSort={!sortMenuInHeader(underLargeTitle)}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />
    </>
  );

  return (
    <>
      {(geoMenuInHeader(underLargeTitle) || sortMenuInHeader(underLargeTitle)) && (
        <VenueToolbar geoStats={geoStats} sortOption={sortOption} onSortChange={handleSortChange} />
      )}
      {searchInHeader(underLargeTitle) && (
        <HeaderSearchBar
          placeholder={t('venues.searchPlaceholder')}
          onChangeText={handleSearchChange}
        />
      )}
      {!underLargeTitle && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('venues.title')}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
          {geoStripAndControls}
        </>
      )}

      <LegendList
        ref={listRef}
        testID="venues-list"
        style={{ flex: 1 }}
        // See useListTop: the list starts under the large title and scrolls back to there.
        contentInsetAdjustmentBehavior={underLargeTitle ? 'automatic' : undefined}
        onScroll={underLargeTitle ? listTop.onScroll : undefined}
        scrollToOverflowEnabled={underLargeTitle}
        // Under a large title the geo strip and the pills are in the list: one tap works with
        // the keyboard open.
        keyboardShouldPersistTaps="handled"
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
        ListHeaderComponent={
          underLargeTitle ? (
            <>
              <Text style={[styles.headerSubtitle, styles.largeTitleSubtitle]}>{subtitle}</Text>
              {geoStripAndControls}
            </>
          ) : null
        }
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
