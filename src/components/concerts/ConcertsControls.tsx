import { View, Text, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SortOption } from '@/utils/sort';
import { SearchInput } from '@/components/ui';
import YearFilterList from './YearFilterList';
import type { ConcertsStyles } from './useConcertsStyles';
import { Haptic } from '@/utils/haptics';

const SORT_OPTIONS: SortOption[] = ['recent', 'alphabetical'];

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** False when the search field is in the native bar (searchInHeader). */
  showSearch?: boolean;
  /** False when the year filter is in the native bar (yearMenuInHeader). */
  showYearFilter?: boolean;
  years: string[];
  yearFilter: string | null;
  yearDropdownOpen: boolean;
  onOpenYearDropdown: () => void;
  onCloseYearDropdown: () => void;
  onSelectYear: (year: string | null) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  styles: ConcertsStyles;
};

export default function ConcertsControls({
  searchQuery,
  onSearchChange,
  showSearch = true,
  showYearFilter = true,
  years,
  yearFilter,
  yearDropdownOpen,
  onOpenYearDropdown,
  onCloseYearDropdown,
  onSelectYear,
  sortOption,
  onSortChange,
  styles,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.controls}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <SearchInput
            style={styles.searchInputWrapper}
            placeholder={t('concerts.searchPlaceholder')}
            value={searchQuery}
            onChangeText={onSearchChange}
            accessibilityLabel={t('concerts.searchPlaceholder')}
          />
        </View>
      )}

      {showYearFilter && (
        <Modal
          visible={yearDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={onCloseYearDropdown}
        >
          <Pressable style={styles.modalOverlay} onPress={onCloseYearDropdown}>
            <View style={styles.dropdownSheet}>
              <YearFilterList
                years={years}
                selected={yearFilter}
                onSelect={onSelectYear}
                allLabel={t('common.all')}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      <View style={styles.sortContainer}>
        {/* Year filter — grouped with sort pills (in the native bar on an iPhone) */}
        {showYearFilter && (
          <Pressable
            style={({ pressed }) => [
              styles.yearDropdownTrigger,
              yearFilter && styles.yearDropdownTriggerActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onOpenYearDropdown}
            accessibilityRole="button"
            accessibilityLabel={
              yearFilter
                ? t('concerts.filteredByYear', { year: yearFilter })
                : t('concerts.filterByYear')
            }
            accessibilityHint={t('concerts.opensYearPicker')}
          >
            <Text
              style={[
                styles.yearDropdownTriggerText,
                yearFilter && styles.yearDropdownTriggerTextActive,
              ]}
            >
              {yearFilter ?? t('concerts.yearFilter')}
            </Text>
            <Text
              style={[styles.yearDropdownChevron, yearFilter && styles.yearDropdownChevronActive]}
            >
              ▾
            </Text>
          </Pressable>
        )}

        {SORT_OPTIONS.map((option) => {
          const isActive = sortOption === option;
          const label = option === 'recent' ? t('concerts.mostRecent') : t('concerts.alphabetical');
          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.sortPill,
                isActive && styles.sortPillActive,
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
