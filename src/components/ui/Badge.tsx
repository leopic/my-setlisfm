import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../utils/colors';

interface BadgeProps {
  count: number;
  label?: string;
}

export default function Badge({ count, label }: BadgeProps) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          backgroundColor: colors.success,
          borderRadius: 10,
          borderCurve: 'continuous' as const,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        text: {
          color: colors.textInverse,
          fontSize: 12,
          fontWeight: 'bold',
          fontVariant: ['tabular-nums'] as const,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {count}
        {label ? ` ${label}` : ''}
      </Text>
    </View>
  );
}
