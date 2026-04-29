import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import VenuesMapView from '../../../src/components/VenuesMapView';
import { useChronicleColors } from '../../../src/utils/colors';
import { Type } from '../../../src/utils/typography';

export default function VenuesMapScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const router = useRouter();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        back: {
          ...Type.body,
          color: colors.accent,
          marginBottom: 4,
        },
        title: {
          ...Type.heading,
          color: colors.textPrimary,
        },
        subtitle: {
          ...Type.body,
          color: colors.textSecondary,
        },
        mapWrapper: {
          flex: 1,
          marginBottom: 100,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('map.title')}</Text>
        <Text style={styles.subtitle}>{t('map.subtitle')}</Text>
      </View>

      <View style={styles.mapWrapper}>
        <VenuesMapView />
      </View>
    </SafeAreaView>
  );
}
