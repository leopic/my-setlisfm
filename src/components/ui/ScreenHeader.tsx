import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/utils/colors';

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
  const { t } = useTranslation();
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
          minHeight: 44,
          minWidth: 44,
          justifyContent: 'center' as const,
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
        <TouchableOpacity
          style={styles.backButton}
          testID="back-button"
          onPress={onBackPress}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}
