import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatIsoDate } from '@/utils/date';
import type { dbOperations } from '@/database/operations';

type InsightStats = Awaited<ReturnType<typeof dbOperations.getInsightStats>>;

interface Props {
  stats: InsightStats;
}

export default function InsightCards({ stats }: Props) {
  const colors = useChronicleColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginTop: 24,
          marginHorizontal: 20,
        },
        sectionLabel: {
          ...Type.label,
          color: colors.textMuted,
          letterSpacing: 1.2,
          marginBottom: 10,
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
          marginBottom: 10,
        },
        cardLabel: {
          ...Type.label,
          color: colors.textMuted,
          marginBottom: 4,
          letterSpacing: 0.6,
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
      }),
    [colors],
  );

  const { weekdayDistribution, busiest7Days } = stats;
  const topWeekday = [...weekdayDistribution].sort((a, b) => b.concertDays - a.concertDays)[0];

  if (!topWeekday && !busiest7Days) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>HABITS</Text>
      <View style={styles.row}>
        {topWeekday && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>TOP DAY</Text>
            <Text style={styles.cardValue}>{topWeekday.weekday}</Text>
            <Text style={styles.cardSub}>{topWeekday.concertDays} concert days</Text>
          </View>
        )}
        {busiest7Days && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>BUSIEST WEEK</Text>
            <Text style={styles.cardValue}>{busiest7Days.days} concert days</Text>
            <Text style={styles.cardSub}>starting {formatIsoDate(busiest7Days.windowStart)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
