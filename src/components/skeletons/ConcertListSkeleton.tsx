import {} from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import { useChronicleColors } from '@/utils/colors';
import { Space } from '@/utils/spacing';
import { Radius } from '@/utils/radius';

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
      paddingHorizontal: Space.edge,
      paddingVertical: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    yearChapter: {
      marginTop: Space.s20,
      marginHorizontal: Space.edge,
    },
    spine: {
      marginLeft: Space.s32,
      paddingLeft: Space.s20,
      borderLeftWidth: 1.5,
      borderLeftColor: colors.border,
    },
    spineEntry: {
      paddingVertical: Space.s12,
      flexDirection: 'row',
      gap: Space.s8,
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
        <SkeletonBox width={52} height={10} borderRadius={Radius.full} />
        <SkeletonBox
          width={130}
          height={15}
          borderRadius={Radius.full}
          style={{ marginTop: Space.s4 }}
        />
        <SkeletonBox
          width={100}
          height={12}
          borderRadius={Radius.full}
          style={{ marginTop: Space.s4 }}
        />
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
          borderRadius={Radius.full}
          style={{ opacity: dim ? 0.25 : 0.4 }}
        />
        <SkeletonBox
          width={70}
          height={11}
          borderRadius={Radius.full}
          style={{ marginTop: Space.s4 }}
        />
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
  const styles = buildStyles(colors);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.container}
      testID="loading-skeleton"
    >
      {showHeader && (
        <View style={styles.header}>
          <SkeletonBox
            width={48}
            height={13}
            borderRadius={Radius.sm}
            style={{ marginBottom: Space.s4 }}
          />
          <SkeletonBox width={180} height={22} borderRadius={Radius.full} />
          <SkeletonBox
            width={140}
            height={13}
            borderRadius={Radius.full}
            style={{ marginTop: Space.s4 }}
          />
        </View>
      )}

      <YearChapter styles={styles} entryCount={3} dim={false} />
      <YearChapter styles={styles} entryCount={2} dim={true} />
    </SafeAreaView>
  );
}
