import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import type { SortOption } from '../utils/sort';
import { colors } from '../utils/colors';

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
  sortOptions = {
    recent: 'Most Recent',
    top: 'Top',
    alphabetical: 'Name',
  },
}: SortAndSearchProps) {
  return (
    <View style={styles.sortContainer}>
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]}
            onPress={() => onSortChange('recent')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'recent' && styles.sortButtonTextActive,
              ]}
            >
              {sortOptions.recent}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'top' && styles.sortButtonActive]}
            onPress={() => onSortChange('top')}
          >
            <Text
              style={[styles.sortButtonText, sortOption === 'top' && styles.sortButtonTextActive]}
            >
              {sortOptions.top}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'alphabetical' && styles.sortButtonActive]}
            onPress={() => onSortChange('alphabetical')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === 'alphabetical' && styles.sortButtonTextActive,
              ]}
            >
              {sortOptions.alphabetical}
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    padding: 5,
  },
  sortButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
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
    paddingHorizontal: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 15,
  },
});
