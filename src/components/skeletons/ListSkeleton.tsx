import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '../SkeletonBox';
import { useChronicleColors } from '../../utils/colors';

interface Props {
  cardCount?: number;
  showHeader?: boolean;
  showSortBar?: boolean;
}

export default function ListSkeleton({
  cardCount = 5,
  showHeader = true,
  showSortBar = false,
}: Props) {
  const colors = useChronicleColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerSubtitle: {
          marginTop: 6,
        },
        searchBar: {
          marginHorizontal: 16,
          marginVertical: 10,
          height: 38,
          borderRadius: 10,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        sortPills: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          marginBottom: 8,
        },
        listRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
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
      {showHeader && (
        <View style={styles.header}>
          <SkeletonBox width={120} height={22} borderRadius={4} />
          <SkeletonBox width={160} height={14} borderRadius={4} style={styles.headerSubtitle} />
        </View>
      )}

      <SkeletonBox width="100%" height={38} borderRadius={10} style={styles.searchBar} />

      {showSortBar && (
        <View style={styles.sortPills}>
          <SkeletonBox width={80} height={28} borderRadius={20} />
          <SkeletonBox width={80} height={28} borderRadius={20} />
          <SkeletonBox width={80} height={28} borderRadius={20} />
        </View>
      )}

      {Array.from({ length: cardCount }).map((_, i) => (
        <View key={i} style={styles.listRow}>
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
