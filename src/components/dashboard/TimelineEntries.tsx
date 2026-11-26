import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { formatDate } from '@/utils/date';
import { toOrdinal } from '@/utils/ordinal';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { ConcertEntry, Milestone } from './types';
import { concertHref } from './useOpenConcert';
import { useConcertMenu } from '@/components/concerts/useConcertMenu';
import { Space } from '@/utils/spacing';
import { RIVER_DOT_TOP } from '@/components/river';
import { Radius } from '@/utils/radius';
import { useArtistTint } from '@/utils/useArtistTint';
import { Chevron, RowLink } from '@/components/ui';

// Styles for the entries on the phone timeline spine. Call once in the timeline and pass the result down.
// The milestone marker is a 9 pt square turned 45°; a slight rounding keeps it a diamond.
const DIAMOND_CORNER = 2;

export function useTimelineStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    // ── Timeline spine ────────────────────────────────────────────────────
    spineContainer: {
      borderLeftWidth: 1.5,
      borderLeftColor: colors.spineColor,
      marginLeft: Space.s32,
      paddingLeft: Space.s20,
      marginBottom: Space.s4,
    },
    concertEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Space.s12,
      // Keeps the › arrow off the screen edge; the row stays tappable up to it.
      paddingRight: Space.edge,
    },
    dotWrapper: {
      position: 'absolute',
      left: -25,
      top: RIVER_DOT_TOP,
    },
    dotActive: {
      width: 9,
      height: 9,
      borderRadius: Radius.full,
      backgroundColor: colors.dotActive,
      borderWidth: 2,
      borderColor: colors.background,
    },
    dotInactive: {
      width: 9,
      height: 9,
      borderRadius: Radius.full,
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
    },
    entryArtist: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    entryVenue: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    entryChevron: {
      ...Type.body,
      color: colors.textDisabled,
      marginLeft: Space.s8,
    },
    entryImageWrapper: {
      marginRight: Space.s12,
    },
    milestoneMarker: {
      width: 9,
      height: 9,
      borderRadius: DIAMOND_CORNER,
      backgroundColor: colors.accent,
      transform: [{ rotate: '45deg' }],
    },
    milestoneTag: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
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
  // The artist's photo color for the date and the dot, so the spine shows who you saw.
  const tint = useArtistTint(concert.artistMbid ?? undefined);
  const concertMenu = useConcertMenu();
  return (
    <RowLink href={concertHref(concert.setlistId)} menu={concertMenu(concert)}>
      <Pressable
        style={({ pressed }) => [styles.concertEntry, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityPrefix}, ${concert.artistName}, ${formatDate(concert.eventDate)}`}
        accessibilityHint={t('dashboard.opensConcertDetails')}
      >
        <View style={styles.dotWrapper}>
          <View
            style={[
              isActiveDot ? styles.dotActive : styles.dotInactive,
              tint && { backgroundColor: tint.accent },
            ]}
          />
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
          <Text style={[styles.entryDate, tint && { color: tint.accent }]}>
            {formatDate(concert.eventDate)}
          </Text>
          <Text style={styles.entryArtist}>{concert.artistName}</Text>
          {venueName !== undefined && <Text style={styles.entryVenue}>{venueName}</Text>}
        </View>
        <Chevron style={styles.entryChevron} />
      </Pressable>
    </RowLink>
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
  const concertMenu = useConcertMenu();
  const label = t('dashboard.milestoneShow', {
    ordinal: toOrdinal(milestone.number).toUpperCase(),
  });
  return (
    <RowLink href={concertHref(milestone.setlistId)} menu={concertMenu(milestone)}>
      <Pressable
        style={({ pressed }) => [styles.concertEntry, { opacity: pressed ? 0.7 : 1 }]}
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
        <Chevron style={styles.entryChevron} />
      </Pressable>
    </RowLink>
  );
}
