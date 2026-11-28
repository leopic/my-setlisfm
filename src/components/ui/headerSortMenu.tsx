import { Stack } from 'expo-router';
import type { SortOption } from '@/utils/sort';

export type SortChoice = { option: SortOption; label: string };

type Props = {
  title: string;
  choices: SortChoice[];
  selected: SortOption;
  onSelect: (option: SortOption) => void;
};

/**
 * The Sort By menu in a list's native bar on an iPhone (see sortMenuInHeader), like the Music
 * app's library: one button, the order that is on checked. A function, not a component:
 * Stack.Toolbar only takes its own Menu and Button elements as direct children, and a screen's
 * other menu (the Concerts calendar, the Venues globe) shares the same toolbar. iOS ticks on a pick.
 */
export function headerSortMenu({ title, choices, selected, onSelect }: Props) {
  return (
    <Stack.Toolbar.Menu
      key="sort"
      icon="arrow.up.arrow.down"
      title={title}
      accessibilityLabel={title}
    >
      {choices.map(({ option, label }) => (
        <Stack.Toolbar.MenuAction
          key={option}
          isOn={option === selected}
          onPress={() => onSelect(option)}
        >
          {label}
        </Stack.Toolbar.MenuAction>
      ))}
    </Stack.Toolbar.Menu>
  );
}
