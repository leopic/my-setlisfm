import {} from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import { useChronicleColors } from '@/utils/colors';
import { Space } from '@/utils/spacing';
import { TAB_BAR_PADDING } from '@/utils/spacing';
import { Radius } from '@/utils/radius';

function EntryRow() {
  return (
    <View style={entryRowStyles.row}>
      <SkeletonBox width={48} height={9} borderRadius={Radius.full} />
      <SkeletonBox
        width={140}
        height={14}
        borderRadius={Radius.full}
        style={entryRowStyles.artist}
      />
      <SkeletonBox
        width={100}
        height={11}
        borderRadius={Radius.full}
        style={entryRowStyles.venue}
      />
    </View>
  );
}

const entryRowStyles = StyleSheet.create({
  row: {
    paddingVertical: Space.s12,
  },
  artist: {
    marginTop: Space.s4,
  },
  venue: { marginTop: Space.s4 },
});

interface ChapterProps {
  entryCount: number;
  opacity: number;
  colors: ReturnType<typeof useChronicleColors>;
}

function YearChapter({ entryCount, opacity, colors }: ChapterProps) {
  return (
    <View style={[chapterStyles.chapter, { opacity }]}>
      <SkeletonBox width={100} height={48} borderRadius={Radius.full} style={chapterStyles.year} />
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
    marginTop: Space.s32,
    marginHorizontal: Space.edge,
  },
  year: {
    // opacity applied via parent
  },
  sublabel: {
    marginTop: Space.s4,
  },
  dotRow: {
    marginTop: Space.s8,
  },
  spine: {
    marginLeft: Space.s32,
    paddingLeft: Space.s20,
    borderLeftWidth: 1.5,
  },
});

// underLargeTitle (phone): the screen's native large title stands in for the top bar. iOS ties
// the title to the first scroll view it sees, so this one must sit under it too, or the real
// dashboard opens with the title collapsed.
export default function DashboardSkeleton({
  underLargeTitle = false,
}: {
  underLargeTitle?: boolean;
}) {
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: TAB_BAR_PADDING,
    },
    topBar: {
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsLine: {
      marginTop: Space.s4,
    },
  });

  return (
    <SafeAreaView
      edges={underLargeTitle ? ['left', 'right'] : ['top', 'left', 'right']}
      style={styles.container}
      testID="loading-skeleton"
    >
      <ScrollView
        testID="loading-skeleton-scroll"
        contentInsetAdjustmentBehavior={underLargeTitle ? 'automatic' : undefined}
        contentContainerStyle={styles.scrollContent}
      >
        {!underLargeTitle && (
          <View style={styles.topBar}>
            <View style={styles.topBarRow}>
              <SkeletonBox width={120} height={24} />
              <SkeletonBox width={56} height={20} />
            </View>
            <SkeletonBox width={200} height={13} style={styles.statsLine} />
          </View>
        )}

        <YearChapter entryCount={3} opacity={1} colors={colors} />
        <YearChapter entryCount={2} opacity={0.6} colors={colors} />
        <YearChapter entryCount={1} opacity={0.35} colors={colors} />
      </ScrollView>
    </SafeAreaView>
  );
}
