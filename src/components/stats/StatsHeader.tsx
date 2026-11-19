import { View, Text } from 'react-native';
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
      {totals && (
        <Text style={styles.headerSub}>
          {t('common.show', { count: totals.shows })} ·{' '}
          {t('common.country', { count: totals.countries })}
        </Text>
      )}
    </View>
  );
}
