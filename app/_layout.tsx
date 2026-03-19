import { useEffect, useState } from 'react';
import { databaseManager } from '../src/database/database';
import { Stack } from 'expo-router';

export default function Layout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Initialize database once when the app starts
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

  // Don't render tabs until database is ready
  if (!dbReady) {
    return null; // or a loading screen
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
