import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SortOption } from '@/utils/sort';
import { SearchInput } from '@/components/ui';
import type { VenueStyles } from './venueStyles';

const SORT_OPTIONS: SortOption[] = ['recent', 'top', 'alphabetical'];

type Props = {
  styles: VenueStyles;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

export default function VenueControls({
  styles,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.controls}>
      <SearchInput
        style={styles.searchContainer}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder={t('venues.searchPlaceholder')}
        returnKeyType="search"
      />
      <View style={styles.sortRow}>
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
                isActive && styles.sortPillActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => onSortChange(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.sortPillText, isActive && styles.sortPillTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
