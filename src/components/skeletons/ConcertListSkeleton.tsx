import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from '../SkeletonBox';
import { useColors } from '../../utils/colors';

interface Props {
  showHeader?: boolean;
}

export default function ConcertListSkeleton({ showHeader = true }: Props) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          padding: 20,
          backgroundColor: colors.backgroundCard,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        concertList: {
          flex: 1,
          padding: 20,
        },
        concertItem: {
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container} testID="loading-skeleton">
      {showHeader && (
        <View style={styles.header}>
          <SkeletonBox width={60} height={16} style={{ marginBottom: 12 }} />
          <SkeletonBox width="70%" height={24} style={{ marginBottom: 8 }} />
          <SkeletonBox width="40%" height={16} />
        </View>
      )}

      <View style={styles.concertList}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.concertItem}>
            <SkeletonBox width="50%" height={18} style={{ marginBottom: 8 }} />
            <SkeletonBox width="35%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonBox width="60%" height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}
