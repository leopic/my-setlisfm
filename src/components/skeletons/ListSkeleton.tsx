import {} from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { geoMenuInHeader } from '@/components/venues/geoMenuInHeader';
import { searchInHeader } from '@/utils/searchInHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import { useChronicleColors } from '@/utils/colors';
import { useTabletLayout } from '@/utils/tablet';
import { Space } from '@/utils/spacing';
import { Corner, Radius } from '@/utils/radius';
import { PhotoSize } from '@/utils/photoSize';

// An Artists row photo plus its 2 pt ring, so the text doesn't move when the rows load.
const AVATAR = PhotoSize.row + 4;

interface Props {
  cardCount?: number;
  /** 'sort' = sort bar only · 'artists' = sort bar + avatar rows · 'venues' = sort bar + geo strip */
  variant?: 'sort' | 'artists' | 'venues';
  /**
   * Phone: the screen's native large title stands in for the fake one. iOS ties the title to
   * the first scroll view it sees, so the rows sit in one under it, like the list that follows.
   */
  underLargeTitle?: boolean;
}

export default function ListSkeleton({ cardCount = 5, variant, underLargeTitle = false }: Props) {
  const showSortBar = !!variant;
  const showGeoStrip = variant === 'venues' && !geoMenuInHeader(underLargeTitle);
  // On an iPhone the real search field is already in the native bar.
  const showSearchBar = !searchInHeader(underLargeTitle);
  const showAvatars = variant === 'artists';
  const colors = useChronicleColors();
  const { isTablet, sidebarWidth } = useTabletLayout();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Header ──────────────────────────────────────────────────────
    header: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s16,
      paddingBottom: Space.s16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerSubtitle: {
      marginTop: Space.s4,
    },
    // The list's subtitle under the native title (largeTitleSubtitle in the tabs).
    largeTitleSubtitle: {
      paddingHorizontal: Space.edge,
      paddingBottom: Space.s4,
    },

    // ── Geo strip (venues) ───────────────────────────────────────────
    geoStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Space.s8,
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s12,
    },

    // ── Controls: search + sort ──────────────────────────────────────
    controls: {
      paddingTop: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchBar: {
      marginHorizontal: Space.edge,
      marginBottom: Space.s8,
      height: 40,
      ...Corner.md,
      overflow: 'hidden',
    },
    sortPills: {
      flexDirection: 'row',
      gap: Space.s8,
      paddingHorizontal: Space.edge,
      paddingBottom: Space.s12,
    },

    // ── Insight cards ────────────────────────────────────────────────
    insightCards: {
      paddingHorizontal: Space.edge,
      paddingTop: Space.s16,
      paddingBottom: Space.s12,
      gap: Space.s12,
    },
    insightRow: {
      flexDirection: 'row',
      gap: Space.s12,
    },
    insightHalf: {
      flex: 1,
    },

    // ── List rows ────────────────────────────────────────────────────
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowAvatar: {
      marginRight: Space.s12,
    },
    rowLeft: {
      flex: 1,
    },
    rowLeftSubtitle: {
      marginTop: Space.s4,
    },
    rowRight: {
      width: 44,
      alignItems: 'center',
    },
    rowRightLabel: { marginTop: Space.s4 },

    // ── Tablet master-detail ─────────────────────────────────────────
    masterDetail: { flex: 1, flexDirection: 'row' },
    sidebar: { borderRightWidth: 1, borderRightColor: colors.border },
    detailPane: { flex: 1, backgroundColor: colors.background },
  });

  const sidebarContent = (
    <>
      {/* Header */}
      {underLargeTitle ? (
        <View style={styles.largeTitleSubtitle}>
          <SkeletonBox width={160} height={14} borderRadius={Radius.full} />
        </View>
      ) : (
        <View style={styles.header}>
          <SkeletonBox width={120} height={22} borderRadius={Radius.full} />
          <SkeletonBox
            width={160}
            height={14}
            borderRadius={Radius.full}
            style={styles.headerSubtitle}
          />
        </View>
      )}

      {/* Geo strip (venues) */}
      {showGeoStrip && (
        <View style={styles.geoStrip}>
          <SkeletonBox width={58} height={34} borderRadius={Radius.sm} />
          <SkeletonBox width={94} height={34} borderRadius={Radius.sm} />
          <SkeletonBox width={94} height={34} borderRadius={Radius.sm} />
          <SkeletonBox width={72} height={34} borderRadius={Radius.sm} />
        </View>
      )}

      {/* Search + sort */}
      <View style={styles.controls}>
        {showSearchBar && (
          <SkeletonBox width="auto" height={40} borderRadius={Radius.md} style={styles.searchBar} />
        )}
        {showSortBar && (
          <View style={styles.sortPills}>
            <SkeletonBox width={88} height={28} borderRadius={Radius.full} />
            <SkeletonBox width={60} height={28} borderRadius={Radius.full} />
            <SkeletonBox width={80} height={28} borderRadius={Radius.full} />
          </View>
        )}
      </View>

      {/* List rows */}
      {Array.from({ length: cardCount }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          {showAvatars && (
            <SkeletonBox
              width={AVATAR}
              height={AVATAR}
              borderRadius={Radius.full}
              style={styles.rowAvatar}
            />
          )}
          <View style={styles.rowLeft}>
            <SkeletonBox width="60%" height={15} borderRadius={Radius.full} />
            <SkeletonBox
              width="40%"
              height={12}
              borderRadius={Radius.full}
              style={styles.rowLeftSubtitle}
            />
          </View>
          <View style={styles.rowRight}>
            <SkeletonBox width={28} height={18} borderRadius={Radius.full} />
            <SkeletonBox
              width={32}
              height={10}
              borderRadius={Radius.full}
              style={styles.rowRightLabel}
            />
          </View>
        </View>
      ))}
    </>
  );

  if (isTablet) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.container}
        testID="loading-skeleton"
      >
        <View style={styles.masterDetail}>
          <View style={[styles.sidebar, { width: sidebarWidth }]}>{sidebarContent}</View>
          <View style={styles.detailPane} />
        </View>
      </SafeAreaView>
    );
  }

  if (underLargeTitle) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.container} testID="loading-skeleton">
        <ScrollView testID="loading-skeleton-scroll" contentInsetAdjustmentBehavior="automatic">
          {sidebarContent}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="loading-skeleton"
    >
      {sidebarContent}
    </SafeAreaView>
  );
}
