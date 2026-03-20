import { useMemo } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import SkeletonBox from '../SkeletonBox';
import { useColors } from '../../utils/colors';

interface Props {
  cardCount?: number;
}

export default function DetailSkeleton({ cardCount = 3 }: Props) {
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
          borderBottomColor: colors.border,
        },
        cardList: {
          flex: 1,
          padding: 20,
        },
        card: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous',
          padding: 16,
          marginBottom: 12,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView style={styles.container} testID="loading-skeleton">
      <View style={styles.header}>
        <SkeletonBox width={60} height={16} style={{ marginBottom: 12 }} />
        <SkeletonBox width="60%" height={28} style={{ marginBottom: 8 }} />
        <SkeletonBox width="40%" height={16} />
      </View>

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
