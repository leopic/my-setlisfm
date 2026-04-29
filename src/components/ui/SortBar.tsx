import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/utils/colors';

type SortOption = 'alphabetical' | 'recent' | 'top';

interface SortBarProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
  options?: SortOption[];
}

const LABEL_KEYS: Record<SortOption, string> = {
  alphabetical: 'sort.byName',
  recent: 'sort.mostRecent',
  top: 'sort.top',
};

export default function SortBar({
  value,
  onChange,
  options = ['alphabetical', 'recent', 'top'],
}: SortBarProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 20,
        },
        label: {
          fontSize: 14,
          color: colors.textSecondary,
          marginRight: 10,
        },
        pills: {
          flexDirection: 'row',
          backgroundColor: colors.backgroundPill,
          borderRadius: 20,
          borderCurve: 'continuous' as const,
          padding: 5,
        },
        pill: {
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 15,
          borderCurve: 'continuous' as const,
        },
        pillActive: {
          backgroundColor: colors.primary,
        },
        pillText: {
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: '600',
        },
        pillTextActive: {
          color: colors.textInverse,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('sort.sortBy')}</Text>
      <View style={styles.pills}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pill, value === option && styles.pillActive]}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === option }}
            accessibilityLabel={`${t('sort.sortBy')} ${t(LABEL_KEYS[option])}`}
          >
            <Text style={[styles.pillText, value === option && styles.pillTextActive]}>
              {t(LABEL_KEYS[option])}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
