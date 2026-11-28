import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { YearGroup } from './types';

type Props = {
  yearGroups: YearGroup[];
  yearFilter: string | null;
  onSelectYear: (year: string | null) => void;
};

// The year filter in the Concerts bar on an iPhone; see yearMenuInHeader. iOS ticks on a pick.
export default function ConcertsYearMenu({ yearGroups, yearFilter, onSelectYear }: Props) {
  const { t } = useTranslation();
  return (
    <Stack.Toolbar placement="right">
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
