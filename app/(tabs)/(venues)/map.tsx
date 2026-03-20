import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import VenuesMapView from '../../../src/components/VenuesMapView';
import { useColors } from '../../../src/utils/colors';
import { ScreenHeader } from '../../../src/components/ui';

export default function VenuesMapScreen() {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  }), [colors]);

  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Venues Map"
        subtitle="View all venue locations"
        showBack
        onBackPress={() => router.back()}
      />

      <VenuesMapView />
    </SafeAreaView>
  );
}
