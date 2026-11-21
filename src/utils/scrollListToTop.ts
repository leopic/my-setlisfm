import type { LegendListRef } from '@legendapp/list/react-native';

// LegendList draws only the rows near the screen. Animating up from far down passes rows it
// never drew, so they show empty for a moment (~0.3 s on 308 concerts); from there, jump.
const ANIMATE_WITHIN_SCREENS = 2;

export function scrollListToTop(list: LegendListRef | null) {
  if (!list) return;
  const { scroll, scrollLength } = list.getState();
  list.scrollToOffset({ offset: 0, animated: scroll < scrollLength * ANIMATE_WITHIN_SCREENS });
}
