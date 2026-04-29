import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useColors } from '@/utils/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  testID?: string;
}

export default function Card({ children, style, onPress, testID }: CardProps) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          padding: 16,
        },
      }),
    [colors],
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} testID={testID}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}
