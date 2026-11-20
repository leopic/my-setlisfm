import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { Space } from '@/utils/spacing';
import { TAB_BAR_PADDING } from '@/utils/spacing';

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

  const getCityRow = (city: CityWithStats) => (
    <Pressable
      key={`${city.name}-${city.countryName}`}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => onCityPress(city)}
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
        <Text style={styles.countLabel}>{t('geo.venuesLabel', { count: city.venueCount })}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={styles.list}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: TAB_BAR_PADDING }}
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
