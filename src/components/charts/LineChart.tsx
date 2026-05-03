import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';

export interface LineSeries {
  label: string;
  color: string;
  /** Values in chronological order */
  data: number[];
}

interface LineChartProps {
  series: LineSeries[];
  xLabels?: string[];
  height?: number;
}

/**
 * Renders a horizontal leaderboard bar chart — total cumulative value per series.
 * Works without react-native-svg and reads clearly for a "top artists" comparison.
 */
export default function LineChart({ series, height = 100 }: LineChartProps) {
  const colors = useChronicleColors();

  const ranked = useMemo(
    () =>
      series
        .map((s) => ({ ...s, total: s.data[s.data.length - 1] ?? 0 }))
        .sort((a, b) => b.total - a.total),
    [series],
  );

  const maxTotal = ranked[0]?.total ?? 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { width: '100%', gap: 8, minHeight: height },
        row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        labelWrap: { width: 88 },
        label: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
        trackWrap: {
          flex: 1,
          height: 10,
          backgroundColor: colors.border,
          borderRadius: 5,
          overflow: 'hidden',
        },
        fill: { height: '100%', borderRadius: 5 },
        count: { width: 24, fontSize: 12, fontWeight: '700', textAlign: 'right' },
      }),
    [colors, height],
  );

  return (
    <View style={styles.container}>
      {ranked.map((s) => (
        <View key={s.label} style={styles.row}>
          <View style={styles.labelWrap}>
            <Text style={[styles.label, { color: s.color }]} numberOfLines={1}>
              {s.label}
            </Text>
          </View>
          <View style={styles.trackWrap}>
            <View
              style={[
                styles.fill,
                { width: `${(s.total / maxTotal) * 100}%`, backgroundColor: s.color },
              ]}
            />
          </View>
          <Text style={[styles.count, { color: s.color }]}>{s.total}</Text>
        </View>
      ))}
    </View>
  );
}
