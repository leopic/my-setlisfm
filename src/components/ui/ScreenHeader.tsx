import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '../../utils/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack,
  onBackPress,
}: ScreenHeaderProps) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 10,
        },
        backButton: {
          padding: 10,
          marginBottom: 10,
        },
        backButtonText: {
          color: colors.primary,
          fontSize: 16,
          fontWeight: '600',
        },
        title: {
          fontSize: 28,
          fontWeight: 'bold',
          color: colors.textPrimary,
        },
        subtitle: {
          fontSize: 16,
          color: colors.textSecondary,
          marginTop: 4,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {showBack && (
        <TouchableOpacity style={styles.backButton} testID="back-button" onPress={onBackPress}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}
