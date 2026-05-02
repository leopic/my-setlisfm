import { useEffect, useState } from 'react';
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
import { databaseManager } from '@/database/database';
import { getStoredUsername } from '@/services/syncService';
import { backfillMissingArtistImages } from '@/services/artistImageService';
import { SyncProvider } from '@/contexts/SyncContext';
import { Stack } from 'expo-router';
import '@/i18n';

// Cap SDWebImage's in-memory cache before any images are loaded.
// Default is 0 (unlimited) — with 200 decoded 250×250 ARGB images that's ~48 MB
// that never gets evicted. 20 MB ≈ 80 images; 50-item count covers visible rows.
Image.configureCache({ maxMemoryCost: 20 * 1024 * 1024, maxMemoryCount: 50 });

export { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Layout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);
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

  // fontError means the font CDN was unreachable — fall back to system font gracefully.
  if (!dbReady || hasUsername === null || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SyncProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {hasUsername ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="onboarding" />}
        </Stack>
      </SyncProvider>
    </ThemeProvider>
  );
}
