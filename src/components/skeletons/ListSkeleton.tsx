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
          padding: 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        sortBar: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.surface,
        },
        cardList: {
          flex: 1,
          padding: 20,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderCurve: 'continuous',
          padding: 16,
          marginBottom: 12,
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
          <SkeletonBox width={180} height={28} style={{ marginBottom: 8 }} />
          <SkeletonBox width={120} height={16} />
        </View>
      )}

      {showSortBar && (
        <View style={styles.sortBar}>
          <SkeletonBox width={80} height={32} borderRadius={16} />
          <SkeletonBox width={80} height={32} borderRadius={16} />
          <SkeletonBox width={80} height={32} borderRadius={16} />
        </View>
      )}

      <View style={styles.cardList}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <View key={i} style={styles.card}>
            <SkeletonBox width="60%" height={18} style={{ marginBottom: 8 }} />
            <SkeletonBox width="40%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonBox width="30%" height={14} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
