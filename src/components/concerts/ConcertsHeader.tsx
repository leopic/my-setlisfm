import { View, Text, type StyleProp, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SortOption } from '@/utils/sort';
import type { ConcertsStyles } from './useConcertsStyles';

type Props = {
  sortOption: SortOption;
  totalConcerts: number;
  /** The year the list is filtered to; totalConcerts then counts that year's shows. */
  year?: string;
  styles: ConcertsStyles;
};

export default function ConcertsHeader({ sortOption, totalConcerts, year, styles }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('concerts.title')}</Text>
      <ConcertsSubtitle
        sortOption={sortOption}
        totalConcerts={totalConcerts}
        year={year}
        style={styles.headerSubtitle}
      />
    </View>
  );
}

// The count, the year filter and the order: under the header's title, or under the native
// large title.
export function ConcertsSubtitle({
  sortOption,
  totalConcerts,
  year,
  style,
}: Omit<Props, 'styles'> & { style: StyleProp<TextStyle> }) {
  const { t } = useTranslation();
  return (
    <Text style={style}>
      {year
        ? sortOption === 'alphabetical'
          ? t('concerts.subtitleYearAlphabetical', { count: totalConcerts, year })
          : t('concerts.subtitleYear', { count: totalConcerts, year })
        : sortOption === 'alphabetical'
          ? t('concerts.subtitleAlphabetical', { count: totalConcerts })
          : t('concerts.subtitleByYear', { count: totalConcerts })}
    </Text>
  );
}
