import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import YearChapter from './YearChapter';
import {
  TimelineConcertEntry,
  TimelineMilestoneEntry,
  useTimelineStyles,
  type TimelineStyles,
} from './TimelineEntries';
import { useMonthNames } from './useMonthNames';
import { getYearHighlights } from './yearData';
import type {
  DashboardStats,
  Milestone,
  MonthCounts,
  OnThisDayConcert,
  YearSummary,
} from './types';

type SectionProps = {
  yearStr: string;
  showsInYear: number;
  // Position in the newest-first list; the first year gets the active dot.
  yearIndex: number;
  isPastYear: boolean;
  stats: DashboardStats;
  onThisDay: OnThisDayConcert;
  summary: YearSummary | undefined;
  monthly: MonthCounts | undefined;
  yearMilestones: Milestone[];
  monthNames: string[];
  monthAbbreviations: string[];
  styles: TimelineStyles;
};

// ── Phone: shared JSX ──────────────────────────────────────────────────────

// One year on the phone timeline: chapter header, then its special concerts on the spine.
function YearSection({
  yearStr,
  showsInYear,
  yearIndex,
  isPastYear,
  stats,
  onThisDay,
  summary,
  monthly,
  yearMilestones,
  monthNames,
  monthAbbreviations,
  styles,
}: SectionProps) {
  const { t } = useTranslation();
  const { isLast, isFirst, isOnThisDay, milestones } = getYearHighlights(
    yearStr,
    stats,
    onThisDay,
    yearMilestones,
  );

  return (
    <View>
      <YearChapter
        yearStr={yearStr}
        showsInYear={showsInYear}
        summary={summary}
        isPastYear={isPastYear}
        monthly={monthly}
        monthNames={monthNames}
        monthAbbreviations={monthAbbreviations}
      />

      {(isLast || isOnThisDay || isFirst || milestones.length > 0) && (
        <View style={styles.spineContainer}>
          {isLast && stats.lastConcert && (
            <TimelineConcertEntry
              concert={stats.lastConcert}
              accessibilityPrefix={t('dashboard.mostRecent')}
              isActiveDot={yearIndex === 0}
              styles={styles}
            />
          )}

          {milestones.map((m) => (
            <TimelineMilestoneEntry key={m.number} milestone={m} styles={styles} />
          ))}

          {isOnThisDay && onThisDay && (
            <TimelineConcertEntry
              concert={onThisDay}
              accessibilityPrefix={t('dashboard.yearsAgo', { count: onThisDay.yearsAgo })}
              venueName={onThisDay.venueName}
              styles={styles}
            />
          )}

          {isFirst && stats.firstConcert && (
            <TimelineConcertEntry
              concert={stats.firstConcert}
              accessibilityPrefix={t('dashboard.firstConcert')}
              styles={styles}
            />
          )}
        </View>
      )}
    </View>
  );
}

type Props = {
  stats: DashboardStats;
  onThisDay: OnThisDayConcert;
  yearsSorted: DashboardStats['concertsByYear'];
  summaryByYear: Record<string, YearSummary>;
  monthlyByYear: Record<string, MonthCounts>;
  milestonesByYear: Record<string, Milestone[]>;
};

// Phone layout: every year, newest first.
export function YearTimeline({
  stats,
  onThisDay,
  yearsSorted,
  summaryByYear,
  monthlyByYear,
  milestonesByYear,
}: Props) {
  const { names, abbreviations } = useMonthNames();
  const styles = useTimelineStyles();
  const currentYear = String(new Date().getFullYear());
  return yearsSorted.map((yearItem, yearIndex) => {
    const yearStr = String(yearItem.year);
    return (
      <YearSection
        key={yearStr}
        yearStr={yearStr}
        showsInYear={yearItem.count}
        yearIndex={yearIndex}
        isPastYear={yearStr !== currentYear}
        stats={stats}
        onThisDay={onThisDay}
        summary={summaryByYear[yearStr]}
        monthly={monthlyByYear[yearStr]}
        yearMilestones={milestonesByYear[yearStr] ?? []}
        monthNames={names}
        monthAbbreviations={abbreviations}
        styles={styles}
      />
    );
  });
}
