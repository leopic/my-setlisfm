import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SortOption } from '@/utils/sort';
import { useColors } from '@/utils/colors';

interface SortAndSearchProps {
  sortOption: SortOption;
  searchQuery: string;
  onSortChange: (option: SortOption) => void;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
  sortOptions?: {
    recent: string;
    top: string;
    alphabetical: string;
  };
}

export default function SortAndSearch({
  sortOption,
  searchQuery,
  onSortChange,
  onSearchChange,
  searchPlaceholder,
  sortOptions,
}: SortAndSearchProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        sortContainer: {
          flexDirection: 'column',
          marginTop: 20,
          marginBottom: 15,
          paddingHorizontal: 20,
          backgroundColor: colors.backgroundCard,
          paddingVertical: 20,
        },
        sortRow: {
          flexDirection: 'row',
          alignItems: 'center',
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
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 15,
          borderCurve: 'continuous' as const,
        },
        sortButtonActive: {
          backgroundColor: colors.primary,
        },
        sortButtonText: {
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        sortButtonTextActive: {
          color: colors.textInverse,
        },
        searchInput: {
          height: 40,
          backgroundColor: colors.background,
          borderRadius: 20,
          borderCurve: 'continuous' as const,
          paddingHorizontal: 15,
          fontSize: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginTop: 15,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.sortContainer}>
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>{t('sort.sortBy')}</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]}
            onPress={() => onSortChange('recent')}
            accessibilityRole="button"
            accessibilityState={{ selected: sortOption === 'recent' }}
            accessibilityLabel={sortOptions?.recent ?? t('sort.mostRecent')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'recent' && styles.sortButtonTextActive,
              ]}
            >
              {sortOptions?.recent ?? t('sort.mostRecent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'top' && styles.sortButtonActive]}
            onPress={() => onSortChange('top')}
            accessibilityRole="button"
            accessibilityState={{ selected: sortOption === 'top' }}
            accessibilityLabel={sortOptions?.top ?? t('sort.top')}
          >
            <Text
              style={[styles.sortButtonText, sortOption === 'top' && styles.sortButtonTextActive]}
            >
              {sortOptions?.top ?? t('sort.top')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'alphabetical' && styles.sortButtonActive]}
            onPress={() => onSortChange('alphabetical')}
            accessibilityRole="button"
            accessibilityState={{ selected: sortOption === 'alphabetical' }}
            accessibilityLabel={sortOptions?.alphabetical ?? t('sort.byName')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'alphabetical' && styles.sortButtonTextActive,
              ]}
            >
              {sortOptions?.alphabetical ?? t('sort.byName')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {sortOption === 'alphabetical' && (
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={searchPlaceholder}
        />
      )}
    </View>
  );
}
