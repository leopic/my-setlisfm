import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { OnThisDayConcert } from './types';
import { useOpenConcert } from './useOpenConcert';
import { Space } from '@/utils/spacing';
import { Corner } from '@/utils/radius';

type Props = {
  concert: NonNullable<OnThisDayConcert>;
  // `header`: tablet top bar, shows venue and date. `also`: next to the year heading in the detail panel, shows the venue.
  variant: 'header' | 'also';
};

// Compact "on this day" card for the tablet layout.
export default function CompactOnThisDayCard({ concert, variant }: Props) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const openConcert = useOpenConcert();
  const isAlso = variant === 'also';
  const styles = StyleSheet.create({
    // ── Header OTD card (compact, tablet only) ────────────────────────────
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s8,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      ...Corner.md,
      paddingHorizontal: Space.s12,
      paddingVertical: Space.s4,
    },
    // Also On This Day — same compact style as header OTD
    cardAlso: {
      marginBottom: Space.s4,
    },
    label: {
      ...Type.captionStrong,
      color: colors.accent,
      letterSpacing: 0.8,
    },
    name: {
      ...Type.footnote,
      color: colors.textPrimary,
    },
    meta: {
      ...Type.caption,
      color: colors.textSecondary,
    },
  });
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isAlso && styles.cardAlso,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={() => openConcert(concert.setlistId)}
      accessibilityRole="button"
      accessibilityLabel={t(isAlso ? 'dashboard.alsoOnThisDayLabel' : 'dashboard.onThisDayLabel', {
        count: concert.yearsAgo,
        artist: concert.artistName,
      })}
    >
      {concert.artistMbid && (
        <ArtistImage
          mbid={concert.artistMbid}
          imageUrl={concert.artistImageUrl}
          size={26}
          name={concert.artistName}
        />
      )}
      <View>
        <Text style={styles.label}>
          {isAlso
            ? t('dashboard.alsoOnThisDay')
            : t('dashboard.onThisDayShort', { count: concert.yearsAgo })}
        </Text>
        <Text style={styles.name}>{concert.artistName}</Text>
        {isAlso ? (
          <Text style={styles.meta}>{concert.venueName}</Text>
        ) : (
          <Text style={styles.meta}>
            {concert.venueName} · {formatDate(concert.eventDate)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
