import { View, Text, type StyleProp, type TextStyle } from 'react-native';
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
      <ConcertsSubtitle
        sortOption={sortOption}
        totalConcerts={totalConcerts}
        style={styles.headerSubtitle}
      />
    </View>
  );
}

// The count and the order: under the header's title, or under the native large title.
export function ConcertsSubtitle({
  sortOption,
  totalConcerts,
  style,
}: Omit<Props, 'styles'> & { style: StyleProp<TextStyle> }) {
  const { t } = useTranslation();
  return (
    <Text style={style}>
      {sortOption === 'alphabetical'
        ? t('concerts.subtitleAlphabetical', { count: totalConcerts })
        : t('concerts.subtitleByYear', { count: totalConcerts })}
    </Text>
  );
}
