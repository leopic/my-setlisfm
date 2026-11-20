import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import VenuesMapView from '@/components/VenuesMapView';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { BackButton } from '@/components/ui';
import { Space } from '@/utils/spacing';

export default function VenuesMapScreen() {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Space.edge,
      // The back button's 44 pt target already adds space above its text.
      paddingTop: Space.s4,
      paddingBottom: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...Type.title1,
      color: colors.textPrimary,
    },
    subtitle: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    mapWrapper: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>{t('map.title')}</Text>
        <Text style={styles.subtitle}>{t('map.subtitle')}</Text>
      </View>

      <View style={styles.mapWrapper}>
        <VenuesMapView />
      </View>
    </SafeAreaView>
  );
}
