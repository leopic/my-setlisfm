import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MONTH_KEYS } from '@/i18n/calendar';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import type { MonthCounts, YearSummary } from './types';

function useChapterStyles() {
  const colors = useChronicleColors();
  return StyleSheet.create({
    // ── Year chapter (phone / phone-like) ─────────────────────────────────
    yearChapter: {
      marginTop: 28,
      marginHorizontal: 20,
      marginBottom: 8,
    },
    yearGhost: {
      ...Type.display,
      fontSize: 64,
      lineHeight: 68,
      color: colors.textPrimary,
      opacity: 0.18,
    },
    yearMeta: {
      ...Type.label,
      color: colors.textMuted,
      marginTop: 2,
    },
    yearStatRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
      flexWrap: 'wrap',
    },
    yearStatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    yearStatValue: {
      ...Type.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    yearStatLabel: {
      ...Type.label,
      color: colors.textMuted,
    },
    monthGrid: {
      flexDirection: 'row',
      marginTop: 6,
      marginBottom: 4,
      gap: 4,
    },
    monthCell: {
      alignItems: 'center',
      flex: 1,
    },
    monthLabel: {
      ...Type.label,
      fontSize: 8,
      color: colors.textDisabled,
      marginBottom: 3,
    },
    monthDotEmpty: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.border,
    },
    monthDotFull: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.accent,
      opacity: 0.45,
    },
    monthDotPeak: {
      width: 8,
      height: 8,
      borderRadius: 4,
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
