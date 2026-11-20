import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { formatDate } from '@/utils/date';
import { toOrdinal } from '@/utils/ordinal';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { ConcertEntry, Milestone } from './types';
import { useOpenConcert } from './useOpenConcert';

// Styles for the entries on the phone timeline spine. Call once in the timeline and pass the result down.
export function useTimelineStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    // ── Timeline spine ────────────────────────────────────────────────────
    spineContainer: {
      borderLeftWidth: 1.5,
      borderLeftColor: colors.spineColor,
      marginLeft: 36,
      paddingLeft: 20,
      marginBottom: 4,
    },
    concertEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    dotWrapper: {
      position: 'absolute',
      left: -25,
      top: 14,
    },
    dotActive: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: colors.dotActive,
      borderWidth: 2,
      borderColor: colors.background,
    },
    dotInactive: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: colors.dotInactive,
      borderWidth: 2,
      borderColor: colors.background,
    },
    entryContent: {
      flex: 1,
    },
    entryDate: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    entryArtist: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    entryVenue: {
      ...Type.subheadline,
      color: colors.textSecondary,
      marginTop: 1,
    },
    entryChevron: {
      ...Type.body,
      color: colors.textDisabled,
      marginLeft: 8,
    },
    entryImageWrapper: {
      marginRight: 10,
    },
    milestoneMarker: {
      width: 9,
      height: 9,
      borderRadius: 2,
      backgroundColor: colors.accent,
      transform: [{ rotate: '45deg' }],
    },
    milestoneTag: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
      marginBottom: 1,
    },
  });
}

export type TimelineStyles = ReturnType<typeof useTimelineStyles>;

type ConcertProps = {
  concert: ConcertEntry;
  // Screen-reader prefix, e.g. "Most recent"; the artist and date follow it.
  accessibilityPrefix: string;
  isActiveDot?: boolean;
  venueName?: string | null;
  styles: TimelineStyles;
};

// One concert on the phone timeline spine (most recent, first or on this day).
export function TimelineConcertEntry({
  concert,
  accessibilityPrefix,
  isActiveDot = false,
  venueName,
  styles,
}: ConcertProps) {
  const { t } = useTranslation();
  const openConcert = useOpenConcert();
  return (
    <Pressable
      style={({ pressed }) => [styles.concertEntry, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => openConcert(concert.setlistId)}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityPrefix}, ${concert.artistName}, ${formatDate(concert.eventDate)}`}
      accessibilityHint={t('dashboard.opensConcertDetails')}
    >
      <View style={styles.dotWrapper}>
        <View style={isActiveDot ? styles.dotActive : styles.dotInactive} />
      </View>
      {concert.artistMbid && (
        <View style={styles.entryImageWrapper}>
          <ArtistImage
            mbid={concert.artistMbid}
            imageUrl={concert.artistImageUrl}
            size={32}
            name={concert.artistName}
          />
        </View>
      )}
      <View style={styles.entryContent}>
        <Text style={styles.entryDate}>{formatDate(concert.eventDate)}</Text>
        <Text style={styles.entryArtist}>{concert.artistName}</Text>
        {venueName !== undefined && <Text style={styles.entryVenue}>{venueName}</Text>}
      </View>
      <Text style={styles.entryChevron}>›</Text>
    </Pressable>
  );
}

// One milestone ("50th show") on the phone timeline spine.
export function TimelineMilestoneEntry({
  milestone,
  styles,
}: {
  milestone: Milestone;
  styles: TimelineStyles;
}) {
  const { t } = useTranslation();
  const openConcert = useOpenConcert();
  const label = t('dashboard.milestoneShow', {
    ordinal: toOrdinal(milestone.number).toUpperCase(),
  });
  return (
    <Pressable
      style={({ pressed }) => [styles.concertEntry, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => openConcert(milestone.setlistId)}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${milestone.artistName}, ${formatDate(milestone.eventDate)}`}
      accessibilityHint={t('dashboard.opensConcertDetails')}
    >
      <View style={styles.dotWrapper}>
        <View style={styles.milestoneMarker} />
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.milestoneTag}>{label}</Text>
        <Text style={styles.entryArtist}>{milestone.artistName}</Text>
        {milestone.cityName ? (
          <Text style={styles.entryVenue}>
            {milestone.cityName} · {formatDate(milestone.eventDate)}
          </Text>
        ) : (
          <Text style={styles.entryVenue}>{formatDate(milestone.eventDate)}</Text>
        )}
      </View>
      <Text style={styles.entryChevron}>›</Text>
    </Pressable>
  );
}
