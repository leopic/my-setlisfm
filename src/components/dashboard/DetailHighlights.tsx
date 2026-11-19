import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ArtistImage from '@/components/ArtistImage';
import { formatDate } from '@/utils/date';
import { toOrdinal } from '@/utils/ordinal';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useOpenConcert } from './useOpenConcert';
import type { ConcertEntry, DashboardStats, Milestone, OnThisDayConcert } from './types';

// Styles shared by the entries in the tablet detail panel. Call once in the panel and pass the result down.
export function useDetailStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    // Highlights
    detailHighlightsLabel: {
      ...Type.label,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: 8,
    },
    detailHighlightEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 6,
    },
    detailHighlightText: {
      flex: 1,
    },
    detailMilestoneTag: {
      ...Type.label,
      color: colors.accent,
      letterSpacing: 0.8,
      marginBottom: 1,
    },
    detailArtistName: {
      ...Type.title,
      color: colors.textPrimary,
    },
    detailMeta: {
      ...Type.body,
      color: colors.textSecondary,
      marginTop: 1,
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
  // The line under the artist name, e.g. the venue and the date.
  meta: ReactNode;
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
    >
      {concert.artistMbid && (
        <ArtistImage
          mbid={concert.artistMbid}
          imageUrl={concert.artistImageUrl}
          size={32}
          name={concert.artistName}
        />
      )}
      <View style={styles.detailHighlightText}>
        <Text style={styles.detailArtistName}>{concert.artistName}</Text>
        <Text style={styles.detailMeta}>{meta}</Text>
      </View>
      <Text style={styles.detailChevron}>›</Text>
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
    >
      <View style={styles.detailHighlightText}>
        <Text style={styles.detailMilestoneTag}>{label}</Text>
        <Text style={styles.detailArtistName}>{milestone.artistName}</Text>
        <Text style={styles.detailMeta}>
          {milestone.cityName ? `${milestone.cityName} · ` : ''}
          {formatDate(milestone.eventDate)}
        </Text>
      </View>
      <Text style={styles.detailChevron}>›</Text>
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
          meta={
            <>
              {onThisDay.venueName} · {formatDate(onThisDay.eventDate)}
            </>
          }
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
