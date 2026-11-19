import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SortOption } from '@/utils/sort';
import type { ConcertsStyles } from './useConcertsStyles';

type Props = {
  sortOption: SortOption;
  totalConcerts: number;
  styles: ConcertsStyles;
};

export default function ConcertsHeader({ sortOption, totalConcerts, styles }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('concerts.title')}</Text>
      <Text style={styles.headerSubtitle}>
        {sortOption === 'alphabetical'
          ? t('concerts.subtitleAlphabetical', { count: totalConcerts })
          : t('concerts.subtitleByYear', { count: totalConcerts })}
      </Text>
    </View>
  );
}
