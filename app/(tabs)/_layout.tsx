import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
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
        name="index"
        options={{
          title: 'Concerts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="artists/index"
        options={{
          title: 'Artists',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="venues/index"
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
      {/* don't create tabs for these screens */}
      <Tabs.Screen
        name="setlist"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/concerts"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/setlist"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="artists/concerts"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="artists/setlist"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/continents"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/countries"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/cities"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/continent-detail"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/country-detail"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="venues/city-detail"
        options={{
            href: null,
        }}
      />
    </Tabs>
  );
}