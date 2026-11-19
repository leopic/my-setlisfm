import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { OnThisDayConcert } from './types';
import { useOpenConcert } from './useOpenConcert';

// "On this day" card at the top of the phone layout.
export default function OnThisDayCard({ onThisDay }: { onThisDay: NonNullable<OnThisDayConcert> }) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const openConcert = useOpenConcert();
  const styles = StyleSheet.create({
    onThisDayCard: {
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 4,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 12,
      padding: 14,
    },
    onThisDayLabel: {
      ...Type.label,
      color: colors.accent,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    onThisDayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    onThisDayArtist: {
      ...Type.title,
      color: colors.textPrimary,
      flex: 1,
    },
    onThisDayMeta: {
      ...Type.body,
      color: colors.textSecondary,
      marginTop: 3,
    },
    onThisDayChevron: {
      ...Type.body,
      color: colors.accent,
      marginLeft: 8,
    },
    entryImageWrapper: {
      marginRight: 10,
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
