import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/date';
import { useChronicleColors } from '../utils/colors';
import { Type } from '../utils/typography';

interface CityWithStats {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venues: string[];
}

interface CityListProps {
  cities: CityWithStats[];
  onCityPress: (city: CityWithStats) => void;
  emptyMessage?: string;
}

export default function CityList({ cities, onCityPress, emptyMessage }: CityListProps) {
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

  const getCityRow = (city: CityWithStats) => (
    <TouchableOpacity
      key={`${city.name}-${city.countryName}`}
      style={styles.row}
      onPress={() => onCityPress(city)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${city.name}, ${city.countryName}`}
    >
      <View style={styles.leftContent}>
        <Text style={styles.name}>{city.name}</Text>
        <Text style={styles.subtitle}>{city.countryName}</Text>
        {city.lastConcertDate && (
          <Text style={styles.meta}>
            {t('common.lastShow', { date: formatDate(city.lastConcertDate) })}
          </Text>
        )}
        {city.venues.length > 0 && (
          <Text style={styles.meta}>
            {city.venues.slice(0, 3).join(', ')}
            {city.venues.length > 3 &&
              ` ${t('common.moreCount', { count: city.venues.length - 3 })}`}
          </Text>
        )}
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.countNumber}>{city.venueCount}</Text>
        <Text style={styles.countLabel}>venues</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.list}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {cities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{emptyMessage ?? t('geo.noCitiesFound')}</Text>
        </View>
      ) : (
        cities.map(getCityRow)
      )}
    </ScrollView>
  );
}
