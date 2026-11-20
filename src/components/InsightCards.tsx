import {} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatIsoDate } from '@/utils/date';
import { useTranslation } from 'react-i18next';
import { WEEKDAY_KEYS } from '@/i18n/calendar';
import type { dbOperations } from '@/database/operations';
import { Space } from '@/utils/spacing';

type InsightStats = Awaited<ReturnType<typeof dbOperations.getInsightStats>>;

interface Props {
  stats: InsightStats;
}

export default function InsightCards({ stats }: Props) {
  const { t } = useTranslation();
  const colors = useChronicleColors();

  const styles = StyleSheet.create({
    section: {
      marginTop: Space.s24,
      marginHorizontal: Space.edge,
    },
    sectionLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: Space.s12,
    },
    row: {
      flexDirection: 'row',
      gap: Space.s12,
    },
    halfCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Space.s16,
    },
    fullCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Space.s16,
      marginBottom: Space.s12,
    },
    cardLabel: {
      ...Type.footnote,
      color: colors.textMuted,
      marginBottom: Space.s4,
      letterSpacing: 0.6,
    },
    cardValue: {
      ...Type.title2,
      color: colors.textPrimary,
    },
    cardSub: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
  });

  const { weekdayDistribution, busiest7Days } = stats;
  const topWeekday = weekdayDistribution.reduce<(typeof weekdayDistribution)[0] | undefined>(
    (max, cur) => (!max || cur.concertDays > max.concertDays ? cur : max),
    undefined,
  );

  if (!topWeekday && !busiest7Days) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('insights.habits')}</Text>
      <View style={styles.row}>
        {topWeekday && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>{t('insights.topDay')}</Text>
            <Text style={styles.cardValue}>
              {t(`weekdays.long.${WEEKDAY_KEYS[topWeekday.dow]}`)}
            </Text>
            <Text style={styles.cardSub}>
              {t('insights.concertDays', { count: topWeekday.concertDays })}
            </Text>
          </View>
        )}
        {busiest7Days && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>{t('insights.busiestWeek')}</Text>
            <Text style={styles.cardValue}>
              {t('insights.concertDays', { count: busiest7Days.days })}
            </Text>
            <Text style={styles.cardSub}>
              {t('insights.startingOn', { date: formatIsoDate(busiest7Days.windowStart) })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
