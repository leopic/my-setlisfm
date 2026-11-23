import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { GeoStats } from './types';

// The globe menu in the Venues bar on an iPhone; see geoMenuInHeader.
export default function VenueGeoMenu({ geoStats }: { geoStats: GeoStats | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon="globe" accessibilityLabel={t('venues.browseByPlace')}>
        <Stack.Toolbar.MenuAction
          icon="globe.europe.africa"
          subtitle={t('common.continent', { count: geoStats?.totalContinents ?? 0 })}
          onPress={() => router.push('/(venues)/continents')}
        >
          {t('venues.continents')}
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon="flag"
          subtitle={t('common.country', { count: geoStats?.totalCountries ?? 0 })}
          onPress={() => router.push('/(venues)/countries')}
        >
          {t('geo.countriesTitle')}
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction
          icon="building.2"
          subtitle={t('common.city', { count: geoStats?.totalCities ?? 0 })}
          onPress={() => router.push('/(venues)/cities')}
        >
          {t('venues.cities')}
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
