import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import { formatDate } from '../../../src/utils/date';
import type { SortOption } from '../../../src/utils/sort';
import { sortByOption } from '../../../src/utils/sort';
import { useColors } from '../../../src/utils/colors';
import ListSkeleton from '../../../src/components/skeletons/ListSkeleton';
import { ScreenHeader, SortBar } from '../../../src/components/ui';

interface ContinentWithStats {
  name: string;
  countryCount: number;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  countries: string[];
}

export default function ContinentsScreen() {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    continentsList: {
      flex: 1,
      padding: 20,
    },
    continentCard: {
      backgroundColor: colors.backgroundPill,
      borderRadius: 10,
      borderCurve: 'continuous' as const,
      padding: 15,
      marginBottom: 10,
    },
    continentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    continentInfo: {
      flex: 1,
      marginRight: 15,
    },
    continentName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 5,
    },
    continentLocation: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    venueCountBadge: {
      backgroundColor: colors.success,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderCurve: 'continuous' as const,
      alignItems: 'center',
      minWidth: 60,
    },
    venueCountText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textInverse,
      fontVariant: ['tabular-nums'] as const,
    },
    venueCountLabel: {
      fontSize: 10,
      color: colors.textInverse,
      opacity: 0.9,
    },
    continentStats: {
      marginTop: 5,
    },
    lastConcertText: {
      fontSize: 14,
      color: colors.success,
      fontWeight: '500',
      marginBottom: 5,
    },
    countriesText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    refreshButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      borderCurve: 'continuous' as const,
    },
    refreshButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
  }), [colors]);

  const router = useRouter();
  const [continents, setContinents] = useState<ContinentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');

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
      Alert.alert('Error', 'Failed to load continents');
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

  const getContinentCard = (continent: ContinentWithStats) => (
    <TouchableOpacity
      key={continent.name}
      style={styles.continentCard}
      testID={`continent-${continent.name}`}
      onPress={() => handleContinentPress(continent)}
      activeOpacity={0.7}
    >
      <View style={styles.continentHeader}>
        <View style={styles.continentInfo}>
          <Text style={styles.continentName}>{continent.name}</Text>
          <Text style={styles.continentLocation}>
            {continent.countryCount} countr{continent.countryCount !== 1 ? 'ies' : 'y'} •{' '}
            {continent.cityCount} cit{continent.cityCount !== 1 ? 'ies' : 'y'}
          </Text>
        </View>
        <View style={styles.venueCountBadge}>
          <Text style={styles.venueCountText}>{continent.venueCount}</Text>
          <Text style={styles.venueCountLabel}>venues</Text>
        </View>
      </View>

      <View style={styles.continentStats}>
        {continent.lastConcertDate && (
          <Text style={styles.lastConcertText}>
            Last show: {formatDate(continent.lastConcertDate)}
          </Text>
        )}
        {continent.countries.length > 0 && (
          <Text style={styles.countriesText}>
            Countries: {continent.countries.slice(0, 3).join(', ')}
            {continent.countries.length > 3 && ` +${continent.countries.length - 3} more`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ListSkeleton showSortBar />;
  }

  return (
    <SafeAreaView style={styles.container} testID="continents-screen">
      {/* Header */}
      <ScreenHeader
        title="Continents"
        subtitle={
          sortOption === 'top'
            ? `${continents.length} continents (sorted by venue count)`
            : `${continents.length} continents`
        }
        showBack
        onBackPress={() => router.back()}
      />

      {/* Sorting Controls */}
      <SortBar value={sortOption} onChange={handleSortChange} />

      <ScrollView style={styles.continentsList} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        {continents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No continents found</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadContinents}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          continents.map(getContinentCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
