import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatDaySpan } from '@/utils/date';
import type { dbOperations } from '@/database/operations';

type ArtistInsights = Awaited<ReturnType<typeof dbOperations.getArtistInsights>>;

interface Props {
  insights: ArtistInsights;
}

export default function ArtistInsightCards({ insights }: Props) {
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
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: 8,
        },
      }),
    [colors],
  );

  const { repeatDepth, artistReunions, artistCityReach } = insights;

  const oneOffPct =
    repeatDepth.totalArtists > 0
      ? Math.round((repeatDepth.oneOff / repeatDepth.totalArtists) * 100)
      : 0;

  const fastest = artistReunions.fastest[0];
  const slowest = artistReunions.slowest[0];
  const topCities = artistCityReach[0];

  return (
    <View style={styles.wrapper}>
      {/* Repeat depth + city reach */}
      <View style={styles.row}>
        {repeatDepth.totalArtists > 0 && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>REPEAT DEPTH</Text>
            <Text style={styles.cardValue}>{oneOffPct}% one-off</Text>
            <Text style={styles.cardSub}>{repeatDepth.repeat} artists seen 2+ times</Text>
          </View>
        )}
        {topCities && (
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>MOST CITIES</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {topCities.artistName}
            </Text>
            <Text style={styles.cardSub}>
              {topCities.cityCount} cities · {topCities.showCount} shows
            </Text>
          </View>
        )}
      </View>

      {/* Reunion gaps */}
      {(fastest || slowest) && (
        <View style={styles.fullCard}>
          <Text style={styles.cardLabel}>REUNION GAPS</Text>
          {fastest && (
            <Text style={styles.cardSub}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Fastest · </Text>
              {`${fastest.artistName} — ${formatDaySpan(fastest.gap)}`}
            </Text>
          )}
          {fastest && slowest && <View style={styles.divider} />}
          {slowest && (
            <Text style={styles.cardSub}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Slowest · </Text>
              {`${slowest.artistName} — ${formatDaySpan(slowest.gap)}`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
