import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { headerSortMenu, type SortChoice } from '@/components/ui';
import type { SortOption } from '@/utils/sort';
import type { YearGroup } from './types';

type Props = {
  yearGroups: YearGroup[];
  yearFilter: string | null;
  onSelectYear: (year: string | null) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

// The Concerts bar on an iPhone: the order (see sortMenuInHeader) and the year filter (see
// yearMenuInHeader). iOS ticks on a pick.
export default function ConcertsToolbar({
  yearGroups,
  yearFilter,
  onSelectYear,
  sortOption,
  onSortChange,
}: Props) {
  const { t } = useTranslation();
  const choices: SortChoice[] = [
    { option: 'recent', label: t('sort.mostRecent') },
    { option: 'alphabetical', label: t('sort.artist') },
  ];
  return (
    <Stack.Toolbar placement="right">
      {headerSortMenu({
        title: t('sort.menuTitle'),
        choices,
        selected: sortOption,
        onSelect: onSortChange,
      })}
      <Stack.Toolbar.Menu
        // A checkmark on the calendar while a year is picked.
        icon={yearFilter ? 'calendar.badge.checkmark' : 'calendar'}
        accessibilityLabel={
          yearFilter
            ? t('concerts.filteredByYear', { year: yearFilter })
            : t('concerts.filterByYear')
        }
      >
        <Stack.Toolbar.MenuAction isOn={yearFilter === null} onPress={() => onSelectYear(null)}>
          {t('concerts.allYears')}
        </Stack.Toolbar.MenuAction>
        {yearGroups.map((group) => (
          <Stack.Toolbar.MenuAction
            key={group.year}
            isOn={yearFilter === group.year}
            subtitle={t('common.concert', { count: group.totalConcerts })}
            onPress={() => onSelectYear(group.year)}
          >
            {group.year}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
