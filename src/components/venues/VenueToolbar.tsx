import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { headerSortMenu, type SortChoice } from '@/components/ui';
import type { SortOption } from '@/utils/sort';
import type { GeoStats } from './types';

type Props = {
  geoStats: GeoStats | null;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

// The Venues bar on an iPhone: the order (see sortMenuInHeader) and the globe menu (see
// geoMenuInHeader).
export default function VenueToolbar({ geoStats, sortOption, onSortChange }: Props) {
  const { t } = useTranslation();
  const choices: SortChoice[] = [
    { option: 'recent', label: t('sort.mostRecent') },
    { option: 'top', label: t('sort.mostVisits') },
    { option: 'alphabetical', label: t('sort.name') },
  ];
  const router = useRouter();
  return (
    <Stack.Toolbar placement="right">
      {headerSortMenu({
        title: t('sort.menuTitle'),
        choices,
        selected: sortOption,
        onSelect: onSortChange,
      })}
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
