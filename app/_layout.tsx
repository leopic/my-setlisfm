import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
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

  if (!dbReady || hasUsername === null) {
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
