import { Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ErrorBoundaryProps } from 'expo-router';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useTranslation } from 'react-i18next';

// Layouts export this as `ErrorBoundary`: Expo Router catches the error itself and renders
// it with the error and a retry callback, so it has no children and keeps no state.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    title: { ...Type.heading, color: colors.textPrimary, marginBottom: 8 },
    message: { ...Type.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    button: {
      backgroundColor: colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderCurve: 'continuous',
    },
    buttonText: { ...Type.title, color: colors.textOnAccent },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {t('errorBoundary.title', { defaultValue: 'Something went wrong' })}
      </Text>
      <Text style={styles.message}>{error.message}</Text>
      <Pressable
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}
        onPress={retry}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>
          {t('errorBoundary.retry', { defaultValue: 'Try Again' })}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
