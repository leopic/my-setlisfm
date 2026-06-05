import React, {} from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
  const styles = StyleSheet.create({
        card: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          padding: 16,
        },
      });

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.card, style, { opacity: pressed ? 0.7 : 1 }]} onPress={onPress} testID={testID}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}
