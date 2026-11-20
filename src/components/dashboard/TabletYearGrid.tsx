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
import { Space } from '@/utils/spacing';
import { Corner } from '@/utils/radius';

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
    // ── Year grid (left column) ───────────────────────────────────────────
    yearGridCol: {
      flex: 1,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      backgroundColor: colors.background,
    },
    yearGridContent: {
      padding: Space.edge,
    },
    yearGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Space.s8,
    },
    yearTile: {
      // flexBasis 30% + flexGrow: 3 items fill the row, 4th wraps
      flexBasis: '30%',
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      ...Corner.md,
      paddingVertical: Space.s12,
      paddingHorizontal: Space.s8,
      alignItems: 'center',
    },
    yearTileSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    yearTileYear: {
      ...Type.title1,
      color: colors.textDisabled,
    },
    yearTileYearSelected: {
      color: colors.accent,
    },
    yearTileCount: {
      ...Type.captionStrong,
      color: colors.textMuted,
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
