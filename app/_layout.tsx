import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { databaseManager } from '../src/database/database';
import { Stack } from 'expo-router';

export { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function Layout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await databaseManager.initialize();
        setDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database in layout:', error);
      }
    };

    initDb();
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
