import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import { useChronicleColors } from '@/utils/colors';

interface Props {
  showHeader?: boolean;
}

function buildStyles(colors: ReturnType<typeof useChronicleColors>) {
  return StyleSheet.create({
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
    yearChapter: {
      marginTop: 20,
      marginHorizontal: 20,
    },
    spine: {
      marginLeft: 28,
      paddingLeft: 20,
      borderLeftWidth: 1.5,
      borderLeftColor: colors.border,
    },
    spineEntry: {
      paddingVertical: 10,
      flexDirection: 'row',
      gap: 8,
    },
    spineEntryColumn: {
      flex: 1,
    },
  });
}

function SpineEntry({ styles }: { styles: ReturnType<typeof buildStyles> }) {
  return (
    <View style={styles.spineEntry}>
      <View style={styles.spineEntryColumn}>
        <SkeletonBox width={52} height={10} borderRadius={4} />
        <SkeletonBox width={130} height={15} borderRadius={4} style={{ marginTop: 4 }} />
        <SkeletonBox width={100} height={12} borderRadius={4} style={{ marginTop: 3 }} />
      </View>
    </View>
  );
}

function YearChapter({
  styles,
  entryCount,
  dim,
}: {
  styles: ReturnType<typeof buildStyles>;
  entryCount: number;
  dim: boolean;
}) {
  return (
    <>
      <View style={styles.yearChapter}>
        <SkeletonBox
          width={90}
          height={40}
          borderRadius={4}
          style={{ opacity: dim ? 0.25 : 0.4 }}
        />
        <SkeletonBox width={70} height={11} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.spine}>
        {Array.from({ length: entryCount }).map((_, i) => (
          <SpineEntry key={i} styles={styles} />
        ))}
      </View>
    </>
  );
}

export default function ConcertListSkeleton({ showHeader = true }: Props) {
  const colors = useChronicleColors();
  const styles = useMemo(() => buildStyles(colors), [colors]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="loading-skeleton"
    >
      {showHeader && (
        <View style={styles.header}>
          <SkeletonBox width={48} height={13} borderRadius={6} style={{ marginBottom: 6 }} />
          <SkeletonBox width={180} height={22} borderRadius={4} />
          <SkeletonBox width={140} height={13} borderRadius={4} style={{ marginTop: 5 }} />
        </View>
      )}

      <YearChapter styles={styles} entryCount={3} dim={false} />
      <YearChapter styles={styles} entryCount={2} dim={true} />
    </SafeAreaView>
  );
}
