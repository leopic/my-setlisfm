import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '../../../src/database/operations';
import { formatDate } from '../../../src/utils/date';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useChronicleColors } from '../../../src/utils/colors';
import { Type } from '../../../src/utils/typography';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { TabScrollView } from '../../../src/components/ui';

interface ContinentWithStats {
  name: string;
  countryCount: number;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  countries: string[];
}

export default function ContinentsScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        inlineHeader: {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        backRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        },
        backButton: {
          ...Type.body,
          color: colors.accent,
        },
        headerTitle: {
          ...Type.heading,
          color: colors.textPrimary,
        },
        headerSubtitle: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        sortPills: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
          paddingTop: 10,
        },
        pill: {
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
        },
        pillActive: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
        pillInactive: {
          backgroundColor: 'transparent',
          borderColor: colors.border,
        },
        pillTextActive: {
          ...Type.label,
          color: colors.accent,
        },
        pillTextInactive: {
          ...Type.label,
          color: colors.textMuted,
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
          marginBottom: 20,
        },
        refreshButton: {
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        refreshButtonText: {
          ...Type.label,
          color: colors.accent,
        },
      }),
    [colors],
  );

  const router = useRouter();
  const [continents, setContinents] = useState<ContinentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContinents();
  }, []);

  const loadContinents = async () => {
    try {
      setLoading(true);
      const continentsWithStats = await dbOperations.getContinentsWithStats();
      const sortedContinents = sortByOption(
        continentsWithStats,
        sortOption,
        undefined,
        (c) => c.venueCount,
      );
      setContinents(sortedContinents);
    } catch (error) {
      console.error('Failed to load continents:', error);
      Alert.alert(t('common.error'), t('geo.failedToLoadContinents'));
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption);
    const sortedContinents = sortByOption(
      continents,
      newSortOption,
      undefined,
      (c) => c.venueCount,
    );
    setContinents(sortedContinents);
  };

  const handleContinentPress = (continent: ContinentWithStats) => {
    router.push({
      pathname: '/(venues)/continent-detail',
      params: {
        continentName: continent.name,
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContinents();
    setRefreshing(false);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'top', label: 'Top' },
  ];

  const getContinentRow = (continent: ContinentWithStats) => (
    <TouchableOpacity
      key={continent.name}
      style={styles.row}
      testID={`continent-${continent.name}`}
      onPress={() => handleContinentPress(continent)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${continent.name}, ${t('common.country', { count: continent.countryCount })}, ${t('common.city', { count: continent.cityCount })}, ${continent.venueCount} ${t('venues.visits')}`}
    >
      <View style={styles.leftContent}>
        <Text style={styles.name}>{continent.name}</Text>
        <Text style={styles.subtitle}>
          {t('common.country', { count: continent.countryCount })}
          {' · '}
          {t('common.city', { count: continent.cityCount })}
        </Text>
        {continent.lastConcertDate && (
          <Text style={styles.meta}>
            {t('common.lastShow', { date: formatDate(continent.lastConcertDate) })}
          </Text>
        )}
        {continent.countries.length > 0 && (
          <Text style={styles.meta}>
            {continent.countries.slice(0, 3).join(', ')}
            {continent.countries.length > 3 &&
              ` ${t('common.moreCount', { count: continent.countries.length - 3 })}`}
          </Text>
        )}
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.countNumber}>{continent.venueCount}</Text>
        <Text style={styles.countLabel}>venues</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="continents-screen"
    >
      {/* Inline header */}
      <View style={styles.inlineHeader}>
        <View style={styles.backRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{t('geo.continentsTitle')}</Text>
        <Text style={styles.headerSubtitle}>
          {sortOption === 'top'
            ? t('geo.continentsSubtitleSorted', { count: continents.length })
            : t('geo.continentsSubtitle', { count: continents.length })}
        </Text>
      </View>

      {/* Sort pills */}
      <View style={styles.sortPills}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pill,
              sortOption === option.value ? styles.pillActive : styles.pillInactive,
            ]}
            onPress={() => handleSortChange(option.value)}
          >
            <Text
              style={sortOption === option.value ? styles.pillTextActive : styles.pillTextInactive}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TabScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {continents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('geo.noContinentsFound')}</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadContinents}
              accessibilityRole="button"
            >
              <Text style={styles.refreshButtonText}>{t('common.refresh')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          continents.map(getContinentRow)
        )}
      </TabScrollView>
    </SafeAreaView>
  );
}
