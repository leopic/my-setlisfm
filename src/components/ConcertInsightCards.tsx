import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatDate, formatIsoDate, formatDaySpan } from '@/utils/date';
import type { dbOperations } from '@/database/operations';

type ConcertInsights = Awaited<ReturnType<typeof dbOperations.getConcertInsights>>;

interface Props {
  insights: ConcertInsights;
}

export default function ConcertInsightCards({ insights }: Props) {
  const colors = useChronicleColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 4,
          gap: 10,
        },
        row: {
          flexDirection: 'row',
          gap: 10,
        },
        halfCard: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
        },
        fullCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
        },
        cardLabel: {
          ...Type.label,
          color: colors.textMuted,
          letterSpacing: 0.6,
          marginBottom: 4,
        },
        cardValue: {
          ...Type.heading,
          color: colors.textPrimary,
          lineHeight: 26,
        },
        cardSub: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 3,
          lineHeight: 18,
        },
        cardSubMuted: {
          ...Type.label,
          color: colors.textMuted,
          marginTop: 2,
        },
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 8,
        },
      }),
    [colors],
  );

  const longestGap = insights.dryStreaks[0];
  const bestStreak = insights.activeStreaks[0];
  const bestDay = insights.busiestDays[0];

  return (
    <View style={styles.wrapper}>
      {/* Longest gap + best streak */}
      <View style={styles.row}>
        {longestGap && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>LONGEST GAP</Text>
            <Text style={styles.cardValue}>{formatDaySpan(longestGap.gap)}</Text>
            <View style={styles.divider} />
            <Text style={styles.cardSub} numberOfLines={2}>
              {longestGap.fromArtist} → {longestGap.toArtist}
            </Text>
          </View>
        )}
        {bestStreak && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>BEST STREAK</Text>
            <Text style={styles.cardValue}>{formatDaySpan(bestStreak.length)}</Text>
            <Text style={styles.cardSubMuted}>in a row</Text>
            <View style={styles.divider} />
            <Text style={styles.cardSub}>
              {formatIsoDate(bestStreak.startDate)} – {formatIsoDate(bestStreak.endDate)}
            </Text>
          </View>
        )}
      </View>

      {/* Busiest single day */}
      {bestDay && (
        <View style={styles.fullCard}>
          <Text style={styles.cardLabel}>BUSIEST SINGLE DAY</Text>
          <Text style={styles.cardValue}>{formatDate(bestDay.eventDate)}</Text>
          <Text style={styles.cardSub} numberOfLines={2}>
            {bestDay.artistNames}
            {bestDay.concertCount > 3 ? ` · ${bestDay.concertCount} shows` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}
