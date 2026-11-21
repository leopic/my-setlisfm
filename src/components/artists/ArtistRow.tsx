import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { useArtistTint } from '@/utils/useArtistTint';
import { formatDate } from '@/utils/date';
import type { ArtistWithStats } from './types';
import type { ArtistsStyles } from './useArtistsStyles';

type ArtistRowProps = {
  styles: ArtistsStyles;
  artist: ArtistWithStats;
  index: number;
  isSelected: boolean;
  onPress: (artist: ArtistWithStats) => void;
};

export default function ArtistRow({ styles, artist, index, isSelected, onPress }: ArtistRowProps) {
  const { t } = useTranslation();
  const hasAccentBar = index < 2;
  const tint = useArtistTint(artist.mbid);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.artistRow,
        hasAccentBar ? styles.artistRowAccent : styles.artistRowNoAccent,
        isSelected && styles.artistRowSelected,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      testID={`artist-${artist.mbid}`}
      onPress={() => onPress(artist)}
      accessibilityRole="button"
      accessibilityLabel={`${artist.name}, ${t('common.show', { count: artist.concertCount })}`}
      accessibilityHint={t('artists.viewConcertsHint')}
    >
      <View style={styles.artistImageWrapper}>
        <View
          style={[styles.artistImageRing, tint && { borderColor: tint.accent }]}
          testID={tint ? 'artist-ring' : undefined}
        >
          <ArtistImage mbid={artist.mbid} imageUrl={artist.imageUrl} size={40} name={artist.name} />
        </View>
      </View>

      <View style={styles.artistCenter}>
        <Text style={styles.artistName}>{artist.name}</Text>
        {artist.lastConcertDate && (
          <Text style={styles.lastSeenText}>
            {t('common.lastSeen', { date: formatDate(artist.lastConcertDate) })}
          </Text>
        )}
        {artist.venues.length > 0 && (
          <Text style={styles.venuesText} numberOfLines={1}>
            {artist.venues.slice(0, 3).join(', ')}
            {artist.venues.length > 3 &&
              ` ${t('common.moreCount', { count: artist.venues.length - 3 })}`}
          </Text>
        )}
      </View>

      <Text style={[styles.countText, index < 3 ? styles.countTextTop : styles.countTextDefault]}>
        {artist.concertCount}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
