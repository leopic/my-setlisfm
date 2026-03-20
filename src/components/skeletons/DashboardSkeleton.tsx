import { useMemo } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import SkeletonBox from '../SkeletonBox';
import { useColors } from '../../utils/colors';

export default function DashboardSkeleton() {
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
          paddingTop: 10,
        },
        statsRow: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          marginBottom: 20,
          gap: 8,
        },
        section: {
          marginHorizontal: 20,
          marginBottom: 16,
        },
        yearRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
        },
        yearBarContainer: {
          flex: 1,
          marginHorizontal: 10,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView style={styles.container} testID="loading-skeleton">
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <SkeletonBox width={140} height={28} />
        </View>

        <View style={styles.statsRow}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBox key={i} width={0} height={70} borderRadius={12} style={{ flex: 1 }} />
          ))}
        </View>

        <View style={styles.section}>
          <SkeletonBox width="100%" height={120} borderRadius={12} />
        </View>

        <View style={styles.section}>
          <SkeletonBox width="100%" height={80} borderRadius={12} />
        </View>

        <View style={styles.section}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.yearRow}>
              <SkeletonBox width={44} height={16} />
              <View style={styles.yearBarContainer}>
                <SkeletonBox width="100%" height={20} />
              </View>
              <SkeletonBox width={24} height={16} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
