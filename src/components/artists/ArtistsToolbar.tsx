import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { headerSortMenu, type SortChoice } from '@/components/ui';
import type { SortOption } from '@/utils/sort';

type Props = {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

// The Artists bar on an iPhone: the order (see sortMenuInHeader).
export default function ArtistsToolbar({ sortOption, onSortChange }: Props) {
  const { t } = useTranslation();
  const choices: SortChoice[] = [
    { option: 'recent', label: t('sort.mostRecent') },
    { option: 'top', label: t('sort.mostConcerts') },
    { option: 'alphabetical', label: t('sort.name') },
  ];
  return (
    <Stack.Toolbar placement="right">
      {headerSortMenu({
        title: t('sort.menuTitle'),
        choices,
        selected: sortOption,
        onSelect: onSortChange,
      })}
    </Stack.Toolbar>
  );
}
