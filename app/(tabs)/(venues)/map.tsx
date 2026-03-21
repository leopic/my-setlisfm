import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import VenuesMapView from '../../../src/components/VenuesMapView';
import { useColors } from '../../../src/utils/colors';
import { ScreenHeader } from '../../../src/components/ui';

export default function VenuesMapScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors],
  );

  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title={t('map.title')}
        subtitle={t('map.subtitle')}
        showBack
        onBackPress={() => router.back()}
      />

      <VenuesMapView />
    </SafeAreaView>
  );
}
