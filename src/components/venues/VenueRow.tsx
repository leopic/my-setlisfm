import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/date';
import type { VenueStyles } from './venueStyles';
import type { VenueWithStats } from './types';

type Props = {
  styles: VenueStyles;
  venue: VenueWithStats;
  isSelected: boolean;
  onPress: (venue: VenueWithStats) => void;
};

export default function VenueRow({ styles, venue, isSelected, onPress }: Props) {
  const { t } = useTranslation();
  const locationParts = [venue.cityName, venue.state, venue.countryName].filter(Boolean);
  const locationText =
    locationParts.length > 0 ? locationParts.join(', ') : t('common.unknownLocation');

  const topArtists = venue.artists.slice(0, 3).join(', ');
  const extraArtists = venue.artists.length > 3 ? venue.artists.length - 3 : 0;
  const artistsText =
    venue.artists.length > 0
      ? topArtists + (extraArtists > 0 ? ` ${t('common.moreCount', { count: extraArtists })}` : '')
      : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.venueRow,
        isSelected && styles.venueRowSelected,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      testID={`venue-${venue.id}`}
      onPress={() => onPress(venue)}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${t('common.visit', { count: venue.concertCount })}`}
    >
      <View style={styles.venueLeft}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.venueLocation}>{locationText}</Text>
        {venue.lastConcertDate && (
          <Text style={styles.venueLastShow}>
            {t('common.lastShow', { date: formatDate(venue.lastConcertDate) })}
          </Text>
        )}
        {artistsText && <Text style={styles.venueArtists}>{artistsText}</Text>}
      </View>
      <View style={styles.venueRight}>
        <Text style={styles.visitCount}>{venue.concertCount}</Text>
        <Text style={styles.visitLabel}>
          {t('venues.visitsLabel', { count: venue.concertCount })}
        </Text>
      </View>
    </Pressable>
  );
}
