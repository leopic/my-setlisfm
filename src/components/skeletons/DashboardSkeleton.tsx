import { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '../SkeletonBox';
import { useChronicleColors } from '../../utils/colors';

function EntryRow() {
  return (
    <View style={entryRowStyles.row}>
      <SkeletonBox width={48} height={9} borderRadius={5} />
      <SkeletonBox width={140} height={14} borderRadius={4} style={entryRowStyles.artist} />
      <SkeletonBox width={100} height={11} borderRadius={4} style={entryRowStyles.venue} />
    </View>
  );
}

const entryRowStyles = StyleSheet.create({
  row: {
    paddingVertical: 10,
  },
  artist: {
    marginTop: 4,
  },
  venue: {
    marginTop: 3,
  },
});

interface ChapterProps {
  entryCount: number;
  opacity: number;
  colors: ReturnType<typeof useChronicleColors>;
}

function YearChapter({ entryCount, opacity, colors }: ChapterProps) {
  return (
    <View style={[chapterStyles.chapter, { opacity }]}>
      <SkeletonBox width={100} height={48} borderRadius={4} style={chapterStyles.year} />
      <SkeletonBox width={80} height={11} style={chapterStyles.sublabel} />
      <SkeletonBox width="100%" height={1} borderRadius={0} style={chapterStyles.dotRow} />
      <View style={[chapterStyles.spine, { borderLeftColor: colors.border }]}>
        {Array.from({ length: entryCount }).map((_, i) => (
          <EntryRow key={i} />
        ))}
      </View>
    </View>
  );
}

const chapterStyles = StyleSheet.create({
  chapter: {
    marginTop: 28,
    marginHorizontal: 20,
  },
  year: {
    // opacity applied via parent
  },
  sublabel: {
    marginTop: 4,
  },
  dotRow: {
    marginTop: 8,
  },
  spine: {
    marginLeft: 36,
    paddingLeft: 20,
    borderLeftWidth: 1.5,
  },
});

export default function DashboardSkeleton() {
  const colors = useChronicleColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          paddingBottom: 100,
        },
        topBar: {
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        topBarRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        statsLine: {
          marginTop: 6,
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <View style={styles.topBarRow}>
            <SkeletonBox width={120} height={24} />
            <SkeletonBox width={56} height={20} borderRadius={10} />
          </View>
          <SkeletonBox width={200} height={13} style={styles.statsLine} />
        </View>

        <YearChapter entryCount={3} opacity={1} colors={colors} />
        <YearChapter entryCount={2} opacity={0.6} colors={colors} />
        <YearChapter entryCount={1} opacity={0.35} colors={colors} />
      </ScrollView>
    </SafeAreaView>
  );
}
