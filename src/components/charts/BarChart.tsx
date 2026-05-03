import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
  showLabels?: boolean;
}

export default function BarChart({ data, color, height = 80, showLabels = true }: BarChartProps) {
  const colors = useChronicleColors();
  const barColor = color ?? colors.accent;

  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { width: '100%' },
        bars: { flexDirection: 'row', alignItems: 'flex-end', height, gap: 3 },
        bar: { flex: 1, borderRadius: 2 },
        labels: { flexDirection: 'row', gap: 3, marginTop: 4 },
        label: { flex: 1, fontSize: 9, textAlign: 'center', color: colors.textMuted },
      }),
    [colors, height],
  );

  if (!data.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((d, i) => {
          const ratio = d.value / max;
          const barH = Math.max(2, ratio * height);
          const opacity = ratio === 1 ? 1 : ratio > 0.5 ? 0.55 : 0.25;
          return (
            <View
              key={i}
              style={[styles.bar, { height: barH, backgroundColor: barColor, opacity }]}
            />
          );
        })}
      </View>
      {showLabels && (
        <View style={styles.labels}>
          {data.map((d, i) => (
            <Text key={i} style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
