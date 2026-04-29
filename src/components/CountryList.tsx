import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/date';
import { useChronicleColors } from '../utils/colors';
import { Type } from '../utils/typography';

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
  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          flex: 1,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        leftContent: {
          flex: 1,
          marginRight: 12,
        },
        name: {
          ...Type.title,
          color: colors.textPrimary,
        },
        subtitle: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        meta: {
          ...Type.body,
          color: colors.textMuted,
          marginTop: 2,
        },
        rightContent: {
          alignItems: 'center',
          minWidth: 44,
        },
        countNumber: {
          ...Type.count,
          color: colors.accent,
        },
        countLabel: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 1,
        },
        emptyState: {
          alignItems: 'center',
          paddingVertical: 60,
          paddingHorizontal: 16,
        },
        emptyStateText: {
          ...Type.body,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const getCountryRow = (country: CountryWithStats) => (
    <TouchableOpacity
      key={country.name}
      style={styles.row}
      onPress={() => onCountryPress(country)}
      activeOpacity={0.7}
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
        <Text style={styles.countLabel}>venues</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
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
