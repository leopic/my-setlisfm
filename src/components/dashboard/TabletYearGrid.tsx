import {
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { DashboardStats } from './types';

type Props = {
  years: DashboardStats['concertsByYear'];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
};

// Tablet left column: a tile per year, pull to refresh.
export default function TabletYearGrid({
  years,
  selectedYear,
  onSelectYear,
  refreshing,
  onRefresh,
}: Props) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const styles = StyleSheet.create({
    yearGridCol: {
      flex: 1,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      backgroundColor: colors.background,
    },
    yearGridContent: {
      padding: 12,
    },
    yearGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    yearTile: {
      // flexBasis 30% + flexGrow: 3 items fill the row, 4th wraps
      flexBasis: '30%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
    },
    yearTileSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    yearTileYear: {
      ...Type.display,
      fontSize: 26,
      letterSpacing: -1,
      color: colors.textDisabled,
      lineHeight: 30,
    },
    yearTileYearSelected: {
      color: colors.accent,
    },
    yearTileCount: {
      ...Type.label,
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 3,
    },
    yearTileCountSelected: {
      color: colors.accent,
      opacity: 0.75,
    },
  });
  return (
    <ScrollView
      style={styles.yearGridCol}
      contentContainerStyle={styles.yearGridContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.yearGrid}>
        {years.map((y) => {
          const yr = String(y.year);
          const isSelected = yr === selectedYear;
          return (
            <Pressable
              key={yr}
              style={({ pressed }) => [
                styles.yearTile,
                // 4 per row in landscape, 3 in portrait
                { flexBasis: isLandscape ? '23%' : '30%' },
                isSelected && styles.yearTileSelected,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => onSelectYear(yr)}
              accessibilityRole="button"
              accessibilityLabel={`${yr}, ${t('common.show', { count: y.count })}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.yearTileYear, isSelected && styles.yearTileYearSelected]}>
                {yr}
              </Text>
              <Text style={[styles.yearTileCount, isSelected && styles.yearTileCountSelected]}>
                {t('common.show', { count: y.count })}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
