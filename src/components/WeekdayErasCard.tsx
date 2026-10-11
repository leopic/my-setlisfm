import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatEraLabel, type WeekdayEra } from '@/utils/weekdayEras';
import { WEEKDAY_KEYS } from '@/i18n/calendar';

// Heatmap cells go from a faint tint (a day with one show) to full accent (the era's top day)
const EMPTY_ALPHA = 0.03;
const MIN_ALPHA = 0.08;
const MAX_ALPHA = 0.8;

function toRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function withAlpha(hex: string, alpha: number) {
  return `rgba(${toRgb(hex).join(', ')}, ${alpha.toFixed(2)})`;
}

// WCAG relative luminance
function luminance([r, g, b]: number[]) {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: number[], b: number[]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Whichever text colour reads better on the accent blended over the card at this alpha. */
function readableOn(accent: string, surface: string, alpha: number, candidates: string[]) {
  const fill = toRgb(accent).map((c, i) => c * alpha + toRgb(surface)[i] * (1 - alpha));
  return candidates.reduce((best, hex) =>
    contrast(toRgb(hex), fill) > contrast(toRgb(best), fill) ? hex : best,
  );
}

/** Each era's top concert day on a timeline, over a weekday heatmap that shows how close it was. */
export default function WeekdayErasCard({ eras }: { eras: WeekdayEra[] }) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const dayLabels = WEEKDAY_KEYS.map((key) => t(`weekdays.short.${key}`));

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: 10,
    },
    title: { ...Type.label, color: colors.textMuted, letterSpacing: 0.6, marginBottom: 14 },
    timeline: { flexDirection: 'row' },
    spine: {
      position: 'absolute',
      top: 5,
      // From the first dot's centre to the last one's
      left: `${50 / eras.length}%` as DimensionValue,
      right: `${50 / eras.length}%` as DimensionValue,
      height: 1,
      backgroundColor: colors.spineColor,
    },
    era: { flex: 1, alignItems: 'center', gap: 2 },
    dot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: colors.dotActive,
      marginBottom: 6,
    },
    topDay: { ...Type.heading, color: colors.textPrimary },
    eraLabel: { ...Type.label, color: colors.textSecondary },
    eraShare: { ...Type.body, fontSize: 11, color: colors.textMuted },
    heatmap: { marginTop: 18, gap: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rowLabel: { ...Type.label, color: colors.textSecondary, width: 56 },
    dayLabel: { ...Type.label, color: colors.textMuted, flex: 1, textAlign: 'center' },
    cell: {
      flex: 1,
      height: 30,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topCell: { borderWidth: 1.5, borderColor: colors.textPrimary },
    cellText: { ...Type.label, fontSize: 11 },
    hint: { ...Type.body, fontSize: 11, color: colors.textSecondary, marginTop: 10 },
  });

  return (
    <View style={styles.card} testID="weekday-eras-card">
      <Text style={styles.title} accessibilityRole="header">
        {t('stats.topDayByEra')}
      </Text>

      <View style={styles.timeline}>
        <View style={styles.spine} />
        {eras.map((era) => {
          const days = era.topWeekdays.map((d) => dayLabels[d]).join('/');
          const label = formatEraLabel(era);
          return (
            <View
              key={era.startYear}
              style={styles.era}
              accessible
              accessibilityLabel={t('stats.eraSummary', {
                era: label,
                days,
                top: era.topCount,
                total: era.total,
              })}
            >
              <View style={styles.dot} />
              <Text style={styles.topDay} numberOfLines={1} adjustsFontSizeToFit>
                {days}
              </Text>
              <Text style={styles.eraLabel}>{label}</Text>
              <Text style={styles.eraShare}>
                {t('stats.eraShare', { top: era.topCount, total: era.total })}
              </Text>
            </View>
          );
        })}
      </View>

      {/* The timeline above already reads out each era */}
      <View
        style={styles.heatmap}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.row}>
          <View style={{ width: 56 }} />
          {dayLabels.map((day) => (
            <Text key={day} style={styles.dayLabel}>
              {day}
            </Text>
          ))}
        </View>
        {eras.map((era) => (
          <View key={era.startYear} style={styles.row} testID={`era-row-${era.startYear}`}>
            <Text style={styles.rowLabel}>{formatEraLabel(era)}</Text>
            {era.counts.map((count, weekday) => {
              const isTop = count === era.topCount;
              const alpha =
                count === 0
                  ? EMPTY_ALPHA
                  : MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * (count / era.topCount);
              return (
                <View
                  key={weekday}
                  testID={`era-cell-${era.startYear}-${weekday}`}
                  style={[
                    styles.cell,
                    { backgroundColor: withAlpha(colors.accent, alpha) },
                    isTop && styles.topCell,
                  ]}
                >
                  {count > 0 && (
                    <Text
                      style={[
                        styles.cellText,
                        {
                          color: readableOn(colors.accent, colors.surface, alpha, [
                            colors.textPrimary,
                            colors.textOnAccent,
                          ]),
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.hint}>{t('stats.eraHeatmapHint')}</Text>
    </View>
  );
}
