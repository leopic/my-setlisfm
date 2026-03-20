import { NativeTabs } from 'expo-router/unstable-native-tabs';

export { ErrorBoundary } from '../../src/components/ErrorBoundary';

export default function TabLayout() {
  return (
    <NativeTabs initialRouteName="(home)">
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(concerts)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'music.note.list', selected: 'music.note.list' }}
          md="library_music"
        />
        <NativeTabs.Trigger.Label>Concerts</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(artists)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          md="group"
        />
        <NativeTabs.Trigger.Label>Artists</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(venues)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'mappin.and.ellipse', selected: 'mappin.and.ellipse' }}
          md="location_on"
        />
        <NativeTabs.Trigger.Label>Venues</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(debug)">
        <NativeTabs.Trigger.Icon sf={{ default: 'gear', selected: 'gear' }} md="settings" />
        <NativeTabs.Trigger.Label>Debug</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
