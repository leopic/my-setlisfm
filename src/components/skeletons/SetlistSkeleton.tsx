import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import { useChronicleColors } from '@/utils/colors';

function SetDivider({ styles }: { styles: ReturnType<typeof buildStyles> }) {
  return (
    <View style={styles.dividerRow}>
      <SkeletonBox width="100%" height={1} style={styles.dividerLine} />
      <SkeletonBox width={64} height={10} borderRadius={4} />
      <SkeletonBox width="100%" height={1} style={styles.dividerLine} />
    </View>
  );
}

function SongRow({ styles }: { styles: ReturnType<typeof buildStyles> }) {
  return (
    <View style={styles.songRow}>
      <SkeletonBox width={20} height={11} borderRadius={3} />
      <SkeletonBox width="55%" height={14} borderRadius={4} />
    </View>
  );
}

function buildStyles(colors: ReturnType<typeof useChronicleColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    heroBlock: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    songList: {
      flex: 1,
      paddingTop: 16,
    },
    dividerRow: {
      paddingHorizontal: 16,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    dividerLine: {
      flex: 1,
    },
    songRow: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      gap: 10,
    },
    encoreDivider: {
      marginTop: 16,
    },
  });
}

export default function SetlistSkeleton() {
  const colors = useChronicleColors();
  const styles = useMemo(() => buildStyles(colors), [colors]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="loading-skeleton"
    >
      <View style={styles.backBar}>
        <View style={styles.backBarRow}>
          <SkeletonBox width={48} height={14} borderRadius={6} />
          <SkeletonBox width={160} height={20} borderRadius={4} />
        </View>
      </View>

      <View style={styles.heroBlock}>
        <SkeletonBox width={200} height={18} borderRadius={4} />
        <SkeletonBox width={150} height={13} borderRadius={4} style={{ marginTop: 5 }} />
        <SkeletonBox width={120} height={13} borderRadius={4} style={{ marginTop: 4 }} />
        <SkeletonBox width={100} height={11} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      <View style={styles.songList}>
        <SetDivider styles={styles} />
        {Array.from({ length: 6 }).map((_, i) => (
          <SongRow key={i} styles={styles} />
        ))}

        <View style={styles.encoreDivider}>
          <SetDivider styles={styles} />
        </View>
        {Array.from({ length: 2 }).map((_, i) => (
          <SongRow key={i} styles={styles} />
        ))}
      </View>
    </SafeAreaView>
  );
}
