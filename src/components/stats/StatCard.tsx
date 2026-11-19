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
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
