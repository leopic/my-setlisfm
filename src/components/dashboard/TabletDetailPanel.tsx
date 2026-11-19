import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import BarChart from '@/components/charts/BarChart';
import { MONTH_KEYS } from '@/i18n/calendar';
import { formatDate } from '@/utils/date';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import CompactOnThisDayCard from './CompactOnThisDayCard';
import DetailHighlights, { DetailConcertEntry, useDetailStyles } from './DetailHighlights';
import YearStatCards from './YearStatCards';
import { useMonthNames } from './useMonthNames';
import { getYearHighlights } from './yearData';
import type {
  DashboardStats,
  Milestone,
  MonthCounts,
  OnThisDayConcert,
  YearConcerts,
  YearSummary,
} from './types';

type Props = {
  yearStr: string;
  stats: DashboardStats;
  onThisDay: OnThisDayConcert;
  panelOnThisDay: OnThisDayConcert;
  yearConcerts: YearConcerts;
  summary: YearSummary | undefined;
  monthly: MonthCounts | undefined;
  yearMilestones: Milestone[];
};

// Tablet right column: details for the selected year.
export default function TabletDetailPanel({
  yearStr,
  stats,
  onThisDay,
  panelOnThisDay,
  yearConcerts,
  summary,
  monthly,
  yearMilestones,
}: Props) {
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const detailStyles = useDetailStyles();
  const { names, abbreviations } = useMonthNames();
  const styles = StyleSheet.create({
    detailPanel: {
      flex: 2,
      backgroundColor: colors.surface,
    },
    detailPanelContent: {
      padding: 16,
    },
    // Year row: large heading + "Also On This Day" card inline
    detailYearRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
      marginBottom: 12,
    },
    detailYearHeading: {
      ...Type.display,
      fontSize: 52,
      letterSpacing: -2,
      color: colors.textPrimary,
      lineHeight: 54,
    },
    detailChartBox: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 10,
    },
    detailChartLabel: {
      ...Type.label,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
  });

  const showCount = stats.concertsByYear.find((y) => y.year === yearStr)?.count ?? 0;
  const monthlyChartData = abbreviations.map((label, i) => ({
    id: MONTH_KEYS[i],
    label,
    value: monthly?.[i + 1] ?? 0,
  }));
  const { isLast, isFirst, isOnThisDay, milestones } = getYearHighlights(
    yearStr,
    stats,
    onThisDay,
    yearMilestones,
  );

  // Show "Also On This Day" only if it's a different concert from the header OTD
  const showAlsoOnThisDay =
    panelOnThisDay !== null && panelOnThisDay.setlistId !== onThisDay?.setlistId;

  return (
    <ScrollView style={styles.detailPanel} keyboardShouldPersistTaps="handled">
      <View style={styles.detailPanelContent}>
        {/* Year heading + Also On This Day inline */}
        <View style={styles.detailYearRow}>
          <Text style={styles.detailYearHeading}>{yearStr}</Text>
          {showAlsoOnThisDay && panelOnThisDay && (
            <CompactOnThisDayCard concert={panelOnThisDay} variant="also" />
          )}
        </View>

        <YearStatCards showCount={showCount} summary={summary} monthNames={names} />

        {/* Monthly chart — full width */}
        <View style={[styles.detailChartBox, { marginBottom: 14 }]}>
          <Text style={styles.detailChartLabel}>{t('dashboard.monthly')}</Text>
          <BarChart data={monthlyChartData} height={90} showLabels />
        </View>

        {(isLast || isOnThisDay || isFirst || milestones.length > 0) && (
          <DetailHighlights
            stats={stats}
            onThisDay={onThisDay}
            isLast={isLast}
            isFirst={isFirst}
            isOnThisDay={isOnThisDay}
            milestones={milestones}
            styles={detailStyles}
          />
        )}

        {/* Shows this year */}
        {yearConcerts.length > 0 && (
          <>
            <Text style={detailStyles.detailHighlightsLabel}>{t('dashboard.showsHeading')}</Text>
            {yearConcerts.map((c) => (
              <DetailConcertEntry
                key={c.setlistId}
                concert={c}
                meta={
                  <>
                    {c.venueName ? `${c.venueName} · ` : ''}
                    {formatDate(c.eventDate)}
                  </>
                }
                styles={detailStyles}
              />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
