import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { VenueStyles } from './venueStyles';
import type { GeoStats } from './types';

type Props = {
  styles: VenueStyles;
  geoStats: GeoStats | null;
};

export default function VenueGeoStrip({ styles, geoStats }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View style={styles.geoStrip}>
      <Pressable
        style={({ pressed }) => [styles.geoButton, { opacity: pressed ? 0.7 : 1 }]}
        testID="nav-continents"
        onPress={() => router.push('/(venues)/continents')}
        accessibilityRole="button"
        accessibilityLabel={t('common.continent', { count: geoStats?.totalContinents ?? 0 })}
      >
        <Text style={styles.geoButtonLabel}>{t('venues.continents')}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.geoButton, { opacity: pressed ? 0.7 : 1 }]}
        testID="nav-countries"
        onPress={() => router.push('/(venues)/countries')}
        accessibilityRole="button"
        accessibilityLabel={t('common.country', { count: geoStats?.totalCountries ?? 0 })}
      >
        <Text style={styles.geoButtonLabel}>{t('geo.countriesTitle')}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.geoButton, { opacity: pressed ? 0.7 : 1 }]}
        testID="nav-cities"
        onPress={() => router.push('/(venues)/cities')}
        accessibilityRole="button"
        accessibilityLabel={t('common.city', { count: geoStats?.totalCities ?? 0 })}
      >
        <Text style={styles.geoButtonLabel}>{t('venues.cities')}</Text>
      </Pressable>
    </View>
  );
}
