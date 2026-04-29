import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '../SkeletonBox';
import { useChronicleColors } from '../../utils/colors';

export default function SetlistSkeleton() {
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
        setBlock: {
          padding: 20,
        },
        songRow: {
          marginBottom: 10,
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
      <View style={styles.header}>
        <SkeletonBox width={60} height={16} style={{ marginBottom: 16 }} />
        <SkeletonBox width="70%" height={22} style={{ marginBottom: 10 }} />
        <SkeletonBox width="50%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="40%" height={14} />
      </View>

      {[0, 1].map((setIndex) => (
        <View key={setIndex} style={styles.setBlock}>
          <SkeletonBox width={80} height={16} style={{ marginBottom: 14 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.songRow}>
              <SkeletonBox width="80%" height={14} />
            </View>
          ))}
        </View>
      ))}
    </SafeAreaView>
  );
}
