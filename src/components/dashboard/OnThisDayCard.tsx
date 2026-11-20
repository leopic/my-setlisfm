import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { OnThisDayConcert } from './types';
import { useOpenConcert } from './useOpenConcert';
import { Space } from '@/utils/spacing';

// "On this day" card at the top of the phone layout.
export default function OnThisDayCard({ onThisDay }: { onThisDay: NonNullable<OnThisDayConcert> }) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const openConcert = useOpenConcert();
  const styles = StyleSheet.create({
    // ── On this day (phone) ───────────────────────────────────────────────
    onThisDayCard: {
      marginHorizontal: Space.edge,
      marginTop: Space.s16,
      marginBottom: Space.s4,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 12,
      padding: Space.s16,
    },
    onThisDayLabel: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
      marginBottom: Space.s4,
    },
    onThisDayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    onThisDayArtist: {
      ...Type.headline,
      color: colors.textPrimary,
      flex: 1,
    },
    onThisDayMeta: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    onThisDayChevron: {
      ...Type.body,
      color: colors.accent,
      marginLeft: Space.s8,
    },
    entryImageWrapper: {
      marginRight: Space.s12,
    },
  });
  return (
    <Pressable
      style={({ pressed }) => [styles.onThisDayCard, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => openConcert(onThisDay.setlistId)}
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.onThisDayLabel', {
        count: onThisDay.yearsAgo,
        artist: onThisDay.artistName,
      })}
      accessibilityHint={t('dashboard.opensConcertDetails')}
    >
      <Text style={styles.onThisDayLabel}>
        {t('dashboard.onThisDay', { count: onThisDay.yearsAgo })}
      </Text>
      <View style={styles.onThisDayRow}>
        {onThisDay.artistMbid && (
          <View style={styles.entryImageWrapper}>
            <ArtistImage
              mbid={onThisDay.artistMbid}
              imageUrl={onThisDay.artistImageUrl}
              size={44}
              name={onThisDay.artistName}
            />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.onThisDayArtist}>{onThisDay.artistName}</Text>
          <Text style={styles.onThisDayMeta}>
            {onThisDay.venueName} · {formatDate(onThisDay.eventDate)}
          </Text>
        </View>
        <Text style={styles.onThisDayChevron}>›</Text>
      </View>
    </Pressable>
  );
}
