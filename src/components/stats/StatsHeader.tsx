import { View, Text, type StyleProp, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StatsStyles } from './statsStyles';

type Props = {
  styles: StatsStyles;
  // The summary line shows only once there is data to summarise.
  totals?: { shows: number; countries: number };
};

export default function StatsHeader({ styles, totals }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('stats.title')}</Text>
      {totals && <StatsTotals style={styles.headerSub} totals={totals} />}
    </View>
  );
}

// "308 shows · 17 countries": under the header's title, or under the native large title.
export function StatsTotals({
  style,
  totals,
}: {
  style: StyleProp<TextStyle>;
  totals: NonNullable<Props['totals']>;
}) {
  const { t } = useTranslation();
  return (
    <Text style={style}>
      {t('common.show', { count: totals.shows })} ·{' '}
      {t('common.country', { count: totals.countries })}
    </Text>
  );
}
