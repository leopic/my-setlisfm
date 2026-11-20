import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { Space } from '@/utils/spacing';
import { tabBarContentStyle } from '@/components/ui';

interface CountryWithStats {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cities: string[];
}

interface CountryListProps {
  countries: CountryWithStats[];
  onCountryPress: (country: CountryWithStats) => void;
  emptyMessage?: string;
}

export default function CountryList({ countries, onCountryPress, emptyMessage }: CountryListProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    list: {
      flex: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leftContent: {
      flex: 1,
      marginRight: Space.s12,
    },
    name: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    subtitle: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    meta: {
      ...Type.subheadline,
      color: colors.textMuted,
    },
    rightContent: {
      alignItems: 'center',
      minWidth: 44,
    },
    countNumber: {
      ...Type.title3,
      color: colors.accent,
    },
    countLabel: {
      ...Type.footnote,
      color: colors.textMuted,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Space.s64,
      paddingHorizontal: Space.edge,
    },
    emptyStateText: {
      ...Type.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const getCountryRow = (country: CountryWithStats) => (
    <Pressable
      key={country.name}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => onCountryPress(country)}
      accessibilityRole="button"
      accessibilityLabel={country.name}
    >
      <View style={styles.leftContent}>
        <Text style={styles.name}>{country.name}</Text>
        <Text style={styles.subtitle}>{t('common.city', { count: country.cityCount })}</Text>
        {country.lastConcertDate && (
          <Text style={styles.meta}>
            {t('common.lastShow', { date: formatDate(country.lastConcertDate) })}
          </Text>
        )}
        {country.cities.length > 0 && (
          <Text style={styles.meta}>
            {country.cities.slice(0, 3).join(', ')}
            {country.cities.length > 3 &&
              ` ${t('common.moreCount', { count: country.cities.length - 3 })}`}
          </Text>
        )}
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.countNumber}>{country.venueCount}</Text>
        <Text style={styles.countLabel}>{t('geo.venuesLabel', { count: country.venueCount })}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={styles.list}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={tabBarContentStyle}
    >
      {countries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{emptyMessage ?? t('geo.noCountriesFound')}</Text>
        </View>
      ) : (
        countries.map(getCountryRow)
      )}
    </ScrollView>
  );
}
