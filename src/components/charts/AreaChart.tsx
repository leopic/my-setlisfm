import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';

export interface Milestone {
  index: number;
  label: string;
}

interface AreaChartProps {
  data: number[];
  milestones?: Milestone[];
  color?: string;
  height?: number;
}

export default function AreaChart({ data, milestones = [], color, height = 110 }: AreaChartProps) {
  const colors = useChronicleColors();
  const lineColor = color ?? colors.accent;
  const max = useMemo(() => Math.max(...data, 1), [data]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { width: '100%' },
        bars: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          height,
          gap: 2,
          position: 'relative',
        },
        bar: { flex: 1, borderRadius: 2 },
        milestoneRow: {
          flexDirection: 'row',
          marginTop: 8,
          gap: 2,
        },
        milestoneSlot: { flex: 1, alignItems: 'center' },
        milestoneDot: {
          width: 7,
          height: 7,
          borderRadius: 3.5,
        },
        milestoneLabel: {
          fontSize: 9,
          fontWeight: '700',
          marginTop: 3,
          textAlign: 'center',
        },
      }),
    [height],
  );

  if (!data.length) return null;

  // Build milestone set for quick lookup
  const milestoneByIndex = new Map(milestones.map((m) => [m.index, m.label]));

  return (
    <View style={styles.container}>
      {/* Bars representing cumulative growth */}
      <View style={styles.bars}>
        {data.map((v, i) => {
          const ratio = v / max;
          const barH = Math.max(2, ratio * height);
          const hasMilestone = milestoneByIndex.has(i);
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: barH,
                  backgroundColor: lineColor,
                  opacity: hasMilestone ? 1 : ratio > 0.6 ? 0.6 : ratio > 0.3 ? 0.35 : 0.18,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Milestone annotations */}
      {milestones.length > 0 && (
        <View style={styles.milestoneRow}>
          {data.map((_, i) => {
            const label = milestoneByIndex.get(i);
            return (
              <View key={i} style={styles.milestoneSlot}>
                {label ? (
                  <>
                    <View style={[styles.milestoneDot, { backgroundColor: lineColor }]} />
                    <Text style={[styles.milestoneLabel, { color: lineColor }]}>{label}</Text>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
