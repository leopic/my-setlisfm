import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import { useChronicleColors } from '@/utils/colors';

interface Props {
  cardCount?: number;
  showHeader?: boolean;
  showSortBar?: boolean;
  /** Show 2+1 insight-card placeholders above the list rows */
  showInsightCards?: boolean;
  /** Show the geo-navigation strip (venues tab) */
  showGeoStrip?: boolean;
  /** Show a circular avatar on each row (artists tab) */
  showAvatars?: boolean;
}

export default function ListSkeleton({
  cardCount = 5,
  showHeader = true,
  showSortBar = false,
  showInsightCards = false,
  showGeoStrip = false,
  showAvatars = false,
}: Props) {
  const colors = useChronicleColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },

        // ── Header ──────────────────────────────────────────────────────
        header: {
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerSubtitle: {
          marginTop: 6,
        },

        // ── Geo strip (venues) ───────────────────────────────────────────
        geoStrip: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },

        // ── Controls: search + sort ──────────────────────────────────────
        controls: {
          paddingTop: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        searchBar: {
          marginHorizontal: 20,
          marginBottom: 8,
          height: 40,
          borderRadius: 10,
          overflow: 'hidden',
        },
        sortPills: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 10,
        },

        // ── Insight cards ────────────────────────────────────────────────
        insightCards: {
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 10,
        },
        insightRow: {
          flexDirection: 'row',
          gap: 10,
        },
        insightHalf: {
          flex: 1,
        },

        // ── List rows ────────────────────────────────────────────────────
        listRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        rowAvatar: {
          marginRight: 12,
        },
        rowLeft: {
          flex: 1,
        },
        rowLeftSubtitle: {
          marginTop: 5,
        },
        rowRight: {
          width: 44,
          alignItems: 'center',
        },
        rowRightLabel: {
          marginTop: 3,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="loading-skeleton"
    >
      {/* Header */}
      {showHeader && (
        <View style={styles.header}>
          <SkeletonBox width={120} height={22} borderRadius={4} />
          <SkeletonBox width={160} height={14} borderRadius={4} style={styles.headerSubtitle} />
        </View>
      )}

      {/* Geo strip (venues) */}
      {showGeoStrip && (
        <View style={styles.geoStrip}>
          <SkeletonBox width={58} height={34} borderRadius={8} />
          <SkeletonBox width={94} height={34} borderRadius={8} />
          <SkeletonBox width={94} height={34} borderRadius={8} />
          <SkeletonBox width={72} height={34} borderRadius={8} />
        </View>
      )}

      {/* Search + sort */}
      <View style={styles.controls}>
        <SkeletonBox width="100%" height={40} borderRadius={10} style={styles.searchBar} />
        {showSortBar && (
          <View style={styles.sortPills}>
            <SkeletonBox width={88} height={28} borderRadius={20} />
            <SkeletonBox width={60} height={28} borderRadius={20} />
            <SkeletonBox width={80} height={28} borderRadius={20} />
          </View>
        )}
      </View>

      {/* Insight card placeholders (match the 2-card row + 1 full-width card layout) */}
      {showInsightCards && (
        <View style={styles.insightCards}>
          <View style={styles.insightRow}>
            <SkeletonBox width="100%" height={90} borderRadius={12} style={styles.insightHalf} />
            <SkeletonBox width="100%" height={90} borderRadius={12} style={styles.insightHalf} />
          </View>
          <SkeletonBox width="100%" height={90} borderRadius={12} />
        </View>
      )}

      {/* List rows */}
      {Array.from({ length: cardCount }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          {showAvatars && (
            <SkeletonBox width={40} height={40} borderRadius={20} style={styles.rowAvatar} />
          )}
          <View style={styles.rowLeft}>
            <SkeletonBox width="60%" height={15} borderRadius={4} />
            <SkeletonBox width="40%" height={12} borderRadius={4} style={styles.rowLeftSubtitle} />
          </View>
          <View style={styles.rowRight}>
            <SkeletonBox width={28} height={18} borderRadius={4} />
            <SkeletonBox width={32} height={10} borderRadius={4} style={styles.rowRightLabel} />
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
}
