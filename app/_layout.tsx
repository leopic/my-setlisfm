import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { databaseManager } from '../src/database/database';

export default function TabLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Initialize database once when the app starts
    const initDb = async () => {
      try {
        await databaseManager.initialize();
        setDbReady(true);
        console.log('Database initialized successfully in layout');
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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="concerts"
        options={{
          title: 'Concerts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="artists"
        options={{
          title: 'Artists',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="venues"
        options={{
          title: 'Venues',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debug"
        options={{
          title: 'Debug',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
