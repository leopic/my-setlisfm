import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/ui';
import type { SortOption } from '@/utils/sort';
import type { ArtistsStyles } from './useArtistsStyles';
import { Haptic } from '@/utils/haptics';

const SORT_OPTIONS: SortOption[] = ['recent', 'top', 'alphabetical'];

type ArtistsControlsProps = {
  styles: ArtistsStyles;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** False when the search field is in the native bar (searchInHeader). */
  showSearch?: boolean;
  /** False when the order is picked from the native bar (sortMenuInHeader). */
  showSort?: boolean;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

export default function ArtistsControls({
  styles,
  searchQuery,
  onSearchChange,
  showSearch = true,
  showSort = true,
  sortOption,
  onSortChange,
}: ArtistsControlsProps) {
  const { t } = useTranslation();
  // Everything in the native bar (an iPhone): nothing to show above the list.
  if (!showSearch && !showSort) return null;
  return (
    <View style={styles.controls}>
      {showSearch && (
        <SearchInput
          style={styles.searchRow}
          placeholder={t('artists.searchPlaceholder')}
          value={searchQuery}
          onChangeText={onSearchChange}
          accessibilityLabel={t('artists.searchPlaceholder')}
        />
      )}
      {showSort && (
        <View style={styles.sortStrip}>
          {SORT_OPTIONS.map((option) => {
            const isActive = sortOption === option;
            const label =
              option === 'recent'
                ? t('sort.mostRecent')
                : option === 'top'
                  ? t('sort.top')
                  : t('sort.byName');
            return (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.sortPill,
                  isActive ? styles.sortPillActive : styles.sortPillInactive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  if (!isActive) Haptic.selection();
                  onSortChange(option);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={label}
              >
                <Text
                  style={[
                    styles.sortPillText,
                    isActive ? styles.sortPillTextActive : styles.sortPillTextInactive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
