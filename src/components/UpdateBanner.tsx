import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

// Height of the iOS 26 tab bar above the bottom safe area (measured on an iPhone 17 Pro).
// The banner sits just above it, so it never covers a screen's header or back button.
const TAB_BAR_HEIGHT = 62;

// Builds look for an update only at a cold launch, and run it at the next one. This also
// looks when the app comes back to the foreground, and offers a restart once an update has
// downloaded, so a fix shows up without killing the app.
export function UpdateBanner() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const insets = useSafeAreaInsets();
  const { isUpdatePending, isRestarting, downloadedUpdate } = Updates.useUpdates();
  const pendingKey = downloadedUpdate?.updateId ?? 'pending';
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const visible = isUpdatePending && dismissedKey !== pendingKey;

  // A View with an alert role is not announced on iOS, so say it once when it appears.
  useEffect(() => {
    if (visible) AccessibilityInfo.announceForAccessibility(t('updates.ready'));
  }, [visible, t]);

  useEffect(() => {
    // Only builds with a channel can get updates: not a dev client, not the E2E build.
    if (!Updates.isEnabled || !Updates.channel) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void (async () => {
        try {
          const { isAvailable } = await Updates.checkForUpdateAsync();
          if (isAvailable) await Updates.fetchUpdateAsync();
        } catch (error) {
          // Offline, for example; the next launch or foreground tries again.
          console.warn('Update check failed:', error);
        }
      })();
    });
    return () => subscription.remove();
  }, []);

  if (!visible) return null;

  const styles = StyleSheet.create({
    banner: {
      position: 'absolute',
      bottom: insets.bottom + TAB_BAR_HEIGHT + 8,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingLeft: 16,
      paddingRight: 10,
      borderRadius: 12,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      boxShadow: `0 6px 20px ${colors.shadow}`,
    },
    title: { ...Type.headline, color: colors.textPrimary, flex: 1 },
    later: { ...Type.body, color: colors.textSecondary, paddingHorizontal: 6 },
    restart: {
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderCurve: 'continuous',
    },
    restartText: { ...Type.headline, color: colors.textOnAccent },
  });

  return (
    <View style={styles.banner} accessibilityRole="alert" testID="update-banner">
      <Text style={styles.title}>{t('updates.ready')}</Text>
      <Pressable
        onPress={() => setDismissedKey(pendingKey)}
        accessibilityRole="button"
        hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
      >
        <Text style={styles.later}>{t('updates.later')}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.restart, { opacity: pressed || isRestarting ? 0.7 : 1 }]}
        disabled={isRestarting}
        onPress={() => {
          Updates.reloadAsync().catch((error: unknown) => {
            console.warn('Restart failed:', error);
          });
        }}
        accessibilityRole="button"
      >
        <Text style={styles.restartText}>{t('updates.restart')}</Text>
      </Pressable>
    </View>
  );
}
