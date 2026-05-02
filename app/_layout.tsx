import { useEffect, useState, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import {
  useFonts,
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { databaseManager } from '@/database/database';
import { getStoredUsername } from '@/services/syncService';
import { backfillMissingArtistImages } from '@/services/artistImageService';
import { SyncProvider } from '@/contexts/SyncContext';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import '@/i18n';

// Cap SDWebImage's in-memory cache before any images are loaded.
// Default is 0 (unlimited) — with 200 decoded 250×250 ARGB images that's ~48 MB
// that never gets evicted. 20 MB ≈ 80 images; 50-item count covers visible rows.
Image.configureCache({ maxMemoryCost: 20 * 1024 * 1024, maxMemoryCount: 50 });

export { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Layout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const rootNavState = useRootNavigationState();
  const [dbReady, setDbReady] = useState(false);
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);
  const didNavigateRef = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    const init = async () => {
      try {
        await databaseManager.initialize();
        setDbReady(true);
        const username = await getStoredUsername();
        setHasUsername(!!username);
        if (username) {
          // Fire-and-forget: populate any missing artist images in the background.
          backfillMissingArtistImages();
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();
  }, []);

  // Always open the dashboard on launch.
  // We wait for rootNavState.key (truthy once React Navigation has finished
  // restoring persisted state from AsyncStorage) so our replace fires AFTER
  // the restored state — not before it, which is what caused the previous
  // attempts to be overwritten by the artist-tab restoration.
  useEffect(() => {
    if (!rootNavState?.key) return;
    if (dbReady && hasUsername === true && !didNavigateRef.current) {
      didNavigateRef.current = true;
      router.replace('/(tabs)/(home)');
    }
  }, [rootNavState?.key, dbReady, hasUsername, router]);

  // fontError means the font CDN was unreachable — fall back to system font gracefully.
  if (!dbReady || hasUsername === null || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SyncProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {hasUsername ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="onboarding" />}
        </Stack>
      </SyncProvider>
    </ThemeProvider>
  );
}
