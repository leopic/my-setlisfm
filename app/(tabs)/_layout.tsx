import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

export { ErrorBoundary } from '@/components/ErrorBoundary';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t('dashboard.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(concerts)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'music.note.list', selected: 'music.note.list' }}
          md="music_note"
        />
        <NativeTabs.Trigger.Label>{t('dashboard.concerts')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(artists)">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>{t('dashboard.artists')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(venues)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'mappin', selected: 'mappin.circle.fill' }}
          md="location_on"
        />
        <NativeTabs.Trigger.Label>{t('dashboard.venues')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(stats)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* Debug tab — development builds only */}
      {__DEV__ && (
        <NativeTabs.Trigger name="(debug)">
          <NativeTabs.Trigger.Icon sf="gear" md="settings" />
          <NativeTabs.Trigger.Label>Debug</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}
