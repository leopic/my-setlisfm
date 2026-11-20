import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MONTH_KEYS } from '@/i18n/calendar';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { MonthCounts, YearSummary } from './types';
import { Space } from '@/utils/spacing';
import { Radius } from '@/utils/radius';

function useChapterStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    // ── Year chapter (phone / phone-like) ─────────────────────────────────
    yearChapter: {
      marginTop: Space.s32,
      marginHorizontal: Space.edge,
      marginBottom: Space.s8,
    },
    yearGhost: {
      ...Type.yearGhost,
      color: colors.textPrimary,
      opacity: 0.18,
    },
    yearMeta: {
      ...Type.footnote,
      color: colors.textMuted,
    },
    yearStatRow: {
      flexDirection: 'row',
      gap: Space.s12,
      marginTop: Space.s4,
      flexWrap: 'wrap',
    },
    yearStatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.s4,
    },
    yearStatValue: {
      ...Type.footnote,
      color: colors.textSecondary,
    },
    yearStatLabel: {
      ...Type.footnote,
      color: colors.textMuted,
    },
    monthGrid: {
      flexDirection: 'row',
      marginTop: Space.s4,
      marginBottom: Space.s4,
      gap: Space.s4,
    },
    monthCell: {
      alignItems: 'center',
      flex: 1,
    },
    monthLabel: {
      ...Type.captionStrong,
      color: colors.textDisabled,
      marginBottom: Space.s4,
    },
    monthDotEmpty: {
      width: 7,
      height: 7,
      borderRadius: Radius.full,
      backgroundColor: colors.border,
    },
    monthDotFull: {
      width: 7,
      height: 7,
      borderRadius: Radius.full,
      backgroundColor: colors.accent,
      opacity: 0.45,
    },
    monthDotPeak: {
      width: 8,
      height: 8,
      borderRadius: Radius.full,
      backgroundColor: colors.accent,
    },
  });
}

type ChapterStyles = ReturnType<typeof useChapterStyles>;

function YearStatRow({
  summary,
  monthNames,
  styles,
}: {
  summary: YearSummary;
  monthNames: string[];
  styles: ChapterStyles;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.yearStatRow}>
      {summary.countries > 1 && (
        <View style={styles.yearStatChip}>
          <Text style={styles.yearStatValue}>{summary.countries}</Text>
          <Text style={styles.yearStatLabel}>
            {t('dashboard.countryLabel', { count: summary.countries })}
          </Text>
        </View>
      )}
      {summary.cities > 1 && (
        <View style={styles.yearStatChip}>
          <Text style={styles.yearStatValue}>{summary.cities}</Text>
          <Text style={styles.yearStatLabel}>
            {t('dashboard.cityLabel', { count: summary.cities })}
          </Text>
        </View>
      )}
      {summary.peakMonth > 0 && summary.peakMonthCount > 1 && (
        <View style={styles.yearStatChip}>
          <Text style={styles.yearStatLabel}>{t('dashboard.peak')}</Text>
          <Text style={styles.yearStatValue}>{monthNames[summary.peakMonth - 1]}</Text>
          <Text style={styles.yearStatLabel}>({summary.peakMonthCount})</Text>
        </View>
      )}
    </View>
  );
}

function MonthGrid({
  monthly,
  monthAbbreviations,
  styles,
}: {
  monthly: MonthCounts;
  monthAbbreviations: string[];
  styles: ChapterStyles;
}) {
  const peak = Math.max(...Object.values(monthly), 0);
  return (
    <View style={styles.monthGrid}>
      {MONTH_KEYS.map((monthKey, idx) => {
        const count = monthly[idx + 1] ?? 0;
        const isPeak = count > 0 && count === peak;
        return (
          <View key={monthKey} style={styles.monthCell}>
            <Text style={styles.monthLabel}>{monthAbbreviations[idx]}</Text>
            <View
              style={
                count === 0
                  ? styles.monthDotEmpty
                  : isPeak
                    ? styles.monthDotPeak
                    : styles.monthDotFull
              }
            />
          </View>
        );
      })}
    </View>
  );
}

type Props = {
  yearStr: string;
  showsInYear: number;
  summary: YearSummary | undefined;
  isPastYear: boolean;
  monthly: MonthCounts | undefined;
  monthNames: string[];
  monthAbbreviations: string[];
};

// Large ghost year, show count, per-year stats and the month dot grid.
export default function YearChapter({
  yearStr,
  showsInYear,
  summary,
  isPastYear,
  monthly,
  monthNames,
  monthAbbreviations,
}: Props) {
  const { t } = useTranslation();
  const styles = useChapterStyles();
  const showStats = isPastYear && summary && (summary.countries > 1 || summary.cities > 1);
  return (
    <View style={styles.yearChapter}>
      <Text style={styles.yearGhost}>{yearStr}</Text>
      <Text style={styles.yearMeta}>{t('common.show', { count: showsInYear })}</Text>
      {showStats && <YearStatRow summary={summary} monthNames={monthNames} styles={styles} />}
      {monthly && (
        <MonthGrid monthly={monthly} monthAbbreviations={monthAbbreviations} styles={styles} />
      )}
    </View>
  );
}
