import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../src/utils/colors';

export { ErrorBoundary } from '../../src/components/ErrorBoundary';

export default function TabLayout() {
  const colors = useColors();
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarStyle: {
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
      },
      headerShown: false,
    }),
    [colors],
  );

  return (
    <Tabs screenOptions={screenOptions} initialRouteName="(home)">
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(concerts)"
        options={{
          title: 'Concerts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(artists)"
        options={{
          title: 'Artists',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(venues)"
        options={{
          title: 'Venues',
          tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(debug)"
        options={{
          title: 'Debug',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
