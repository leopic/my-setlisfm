import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/utils/colors';

interface StatBoxProps {
  value: number | string;
  label: string;
}

export default function StatBox({ value, label }: StatBoxProps) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          padding: 14,
          alignItems: 'center',
        },
        value: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.primary,
          fontVariant: ['tabular-nums'] as const,
        },
        label: {
          fontSize: 11,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
