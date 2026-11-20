import { View, Text } from 'react-native';
import type { StatsStyles } from './statsStyles';

type Props = {
  styles: StatsStyles;
  value: string | number;
  valueColor: string;
  label: string;
};

export default function StatCard({ styles, value, valueColor, label }: Props) {
  return (
    // One element for VoiceOver, so the value and its label are read together, not row by row.
    <View style={styles.statCard} accessible>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
