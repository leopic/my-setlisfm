import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

interface ListScreenHeaderProps {
  title: string;
  subtitle: string;
}

export default function ListScreenHeader({ title, subtitle }: ListScreenHeaderProps) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = StyleSheet.create({
    inlineHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    backButton: {
      ...Type.body,
      color: colors.accent,
    },
    headerTitle: {
      ...Type.heading,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      ...Type.body,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.inlineHeader}>
      <View style={styles.backRow}>
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={() => router.back()}
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel={t('common.goBack')}
        >
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </Pressable>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
}
