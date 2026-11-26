import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { formatDate } from '@/utils/date';
import { toOrdinal } from '@/utils/ordinal';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useOpenConcert } from './useOpenConcert';
import type { ConcertEntry, DashboardStats, Milestone, OnThisDayConcert } from './types';
import { Space } from '@/utils/spacing';
import { Corner } from '@/utils/radius';
import { Chevron } from '@/components/ui';

// Styles shared by the entries in the tablet detail panel. Call once in the panel and pass the result down.
export function useDetailStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    // Highlights
    detailHighlightsLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: Space.s8,
    },
    detailHighlightEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s12,
      paddingVertical: Space.s8,
      paddingHorizontal: Space.s12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      ...Corner.md,
      marginBottom: Space.s4,
    },
    detailHighlightText: {
      flex: 1,
    },
    detailMilestoneTag: {
      ...Type.footnote,
      color: colors.accent,
      letterSpacing: 0.8,
    },
    detailArtistName: {
      ...Type.headline,
      color: colors.textPrimary,
    },
    detailMeta: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    detailChevron: {
      ...Type.body,
      color: colors.textDisabled,
    },
  });
}

export type DetailStyles = ReturnType<typeof useDetailStyles>;

type ConcertRowProps = {
  concert: ConcertEntry;
  // The line under the artist name, e.g. the venue and the date. Plain text, as it is
  // also part of the row's VoiceOver label.
  meta: string;
  styles: DetailStyles;
};

// A concert row in the tablet detail panel.
export function DetailConcertEntry({ concert, meta, styles }: ConcertRowProps) {
  const openConcert = useOpenConcert();
  return (
    <Pressable
      style={({ pressed }) => [styles.detailHighlightEntry, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => openConcert(concert.setlistId)}
      accessibilityRole="button"
      // The label sets what VoiceOver reads; the Chevron hides itself.
      accessibilityLabel={`${concert.artistName}, ${meta}`}
    >
      {concert.artistMbid && (
        <ArtistImage
          mbid={concert.artistMbid}
          imageUrl={concert.artistImageUrl}
          size="inline"
          name={concert.artistName}
        />
      )}
      <View style={styles.detailHighlightText}>
        <Text style={styles.detailArtistName}>{concert.artistName}</Text>
        <Text style={styles.detailMeta}>{meta}</Text>
      </View>
      <Chevron style={styles.detailChevron} />
    </Pressable>
  );
}

// A milestone row (no artist image) in the tablet detail panel.
function DetailMilestoneEntry({
  milestone,
  styles,
}: {
  milestone: Milestone;
  styles: DetailStyles;
}) {
  const { t } = useTranslation();
  const openConcert = useOpenConcert();
  const label = t('dashboard.milestoneShow', {
    ordinal: toOrdinal(milestone.number).toUpperCase(),
  });
  return (
    <Pressable
      style={({ pressed }) => [styles.detailHighlightEntry, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => openConcert(milestone.setlistId)}
      accessibilityRole="button"
      // The label sets what VoiceOver reads; the Chevron hides itself.
      accessibilityLabel={[
        label,
        milestone.artistName,
        milestone.cityName,
        formatDate(milestone.eventDate),
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <View style={styles.detailHighlightText}>
        <Text style={styles.detailMilestoneTag}>{label}</Text>
        <Text style={styles.detailArtistName}>{milestone.artistName}</Text>
        <Text style={styles.detailMeta}>
          {milestone.cityName ? `${milestone.cityName} · ` : ''}
          {formatDate(milestone.eventDate)}
        </Text>
      </View>
      <Chevron style={styles.detailChevron} />
    </Pressable>
  );
}

type Props = {
  stats: DashboardStats;
  onThisDay: OnThisDayConcert;
  isLast: boolean;
  isFirst: boolean;
  isOnThisDay: boolean;
  milestones: Milestone[];
  styles: DetailStyles;
};

// "Highlights" block of the detail panel: the year's most recent, milestone, on-this-day and first concerts.
export default function DetailHighlights({
  stats,
  onThisDay,
  isLast,
  isFirst,
  isOnThisDay,
  milestones,
  styles,
}: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.detailHighlightsLabel}>{t('dashboard.highlightsLabel')}</Text>

      {isLast && stats.lastConcert && (
        <DetailConcertEntry
          concert={stats.lastConcert}
          meta={formatDate(stats.lastConcert.eventDate)}
          styles={styles}
        />
      )}

      {milestones.map((m) => (
        <DetailMilestoneEntry key={m.number} milestone={m} styles={styles} />
      ))}

      {isOnThisDay && onThisDay && (
        <DetailConcertEntry
          concert={onThisDay}
          // The venue can be missing (left join), so it is left out, not printed as "null".
          meta={[onThisDay.venueName, formatDate(onThisDay.eventDate)].filter(Boolean).join(' · ')}
          styles={styles}
        />
      )}

      {isFirst && stats.firstConcert && (
        <DetailConcertEntry
          concert={stats.firstConcert}
          meta={formatDate(stats.firstConcert.eventDate)}
          styles={styles}
        />
      )}
    </>
  );
}
