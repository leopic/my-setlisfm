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
import { databaseManager } from '../src/database/database';
import { getStoredUsername } from '../src/services/syncService';
import { SyncProvider } from '../src/contexts/SyncContext';
import { Stack } from 'expo-router';
import '../src/i18n';

export { ErrorBoundary } from '../src/components/ErrorBoundary';

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
