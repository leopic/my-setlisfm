import {} from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import { useChronicleColors } from '@/utils/colors';
import { Space } from '@/utils/spacing';

interface Props {
  cardCount?: number;
}

function buildStyles(colors: ReturnType<typeof useChronicleColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    row: {
      paddingVertical: Space.s12,
      paddingHorizontal: Space.edge,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
    },
    rowLeft: {
      flex: 1,
    },
    rowRight: {
      width: 44,
      alignItems: 'center',
    },
  });
}

export default function DetailSkeleton({ cardCount = 3 }: Props) {
  const colors = useChronicleColors();
  const styles = buildStyles(colors);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="loading-skeleton"
    >
      <View style={styles.header}>
        <SkeletonBox width={48} height={13} borderRadius={6} style={{ marginBottom: Space.s4 }} />
        <SkeletonBox width={160} height={22} borderRadius={4} />
        <SkeletonBox width={100} height={13} borderRadius={4} style={{ marginTop: Space.s4 }} />
      </View>

      {Array.from({ length: cardCount }).map((_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rowLeft}>
            <SkeletonBox width="55%" height={15} borderRadius={4} />
            <SkeletonBox width="40%" height={12} borderRadius={4} style={{ marginTop: Space.s4 }} />
          </View>
          <View style={styles.rowRight}>
            <SkeletonBox width={28} height={18} borderRadius={4} />
            <SkeletonBox width={32} height={10} borderRadius={4} style={{ marginTop: Space.s4 }} />
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
}
