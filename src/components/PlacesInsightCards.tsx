import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatDaySpan, isoYear } from '@/utils/date';
import type { dbOperations } from '@/database/operations';

type PlacesInsights = Awaited<ReturnType<typeof dbOperations.getPlacesInsights>>;

interface Props {
  insights: PlacesInsights;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function PlacesInsightCards({ insights }: Props) {
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
      }),
    [colors],
  );

  const { countryTimeline, venueRelationships, cityMonthCombos } = insights;
  const bestVenue = venueRelationships[0];
  const bestCityMonth = cityMonthCombos[0];

  return (
    <View style={styles.wrapper}>
      {/* Country timeline */}
      {countryTimeline.total > 0 && (
        <View style={styles.fullCard}>
          <Text style={styles.cardLabel}>COUNTRIES</Text>
          <Text style={styles.cardValue}>{countryTimeline.total} countries</Text>
          {countryTimeline.first && (
            <Text style={styles.cardSub}>
              First: {countryTimeline.first.countryName} (
              {isoYear(countryTimeline.first.firstVisit)})
              {countryTimeline.latest
                ? `  ·  Latest: ${countryTimeline.latest.countryName} (${isoYear(countryTimeline.latest.firstVisit)})`
                : ''}
            </Text>
          )}
        </View>
      )}

      {/* Venue relationship + city-month */}
      <View style={styles.row}>
        {bestVenue && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>LONGEST RELATIONSHIP</Text>
            <Text style={styles.cardValue} numberOfLines={2}>
              {bestVenue.venueName}
            </Text>
            <Text style={styles.cardSub}>{formatDaySpan(bestVenue.spanDays)}</Text>
            <Text style={styles.cardSubMuted}>{bestVenue.visits} visits</Text>
          </View>
        )}
        {bestCityMonth && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>BEST CITY-MONTH</Text>
            <Text style={styles.cardValue}>{bestCityMonth.cityName}</Text>
            <Text style={styles.cardSub}>
              {MONTH_NAMES[(bestCityMonth.month - 1) % 12]} · {bestCityMonth.concertDays} days
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
