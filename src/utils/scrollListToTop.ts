import { useRef, type RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { LegendListRef } from '@legendapp/list/react-native';

// LegendList draws only the rows near the screen. Animating up from far down passes rows it
// never drew, so they show empty for a moment (~0.3 s on 308 concerts); from there, jump.
const ANIMATE_WITHIN_SCREENS = 2;

// top: where the list rests at its top. Under a native large title that is above 0, see
// useListTop.
export function scrollListToTop(list: LegendListRef | null, top = 0) {
  if (!list) return;
  const { scroll, scrollLength } = list.getState();
  list.scrollToOffset({
    offset: top,
    animated: scroll - top < scrollLength * ANIMATE_WITHIN_SCREENS,
  });
}

// Under a native large title iOS insets the list by the bar's height, so at its top the list
// rests at a negative offset (-168 pt on an iPhone 17), which it reports once as it lays out.
// Scrolling to 0 from there would collapse the title halfway. Pass onScroll to the list and
// top.current to scrollListToTop, and give the list scrollToOverflowEnabled: React Native
// stops a scroll at the scroll view's own inset, which leaves iOS's out too. Until the list
// reports, the top is 0. A list that mounts again (after the empty state) reports again.
export function useListTop(list: RefObject<LegendListRef | null>) {
  const top = useRef(0);
  const reportedBy = useRef<LegendListRef | null>(null);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (reportedBy.current === list.current) return;
    reportedBy.current = list.current;
    top.current = 0;
    const rest = event.nativeEvent.contentOffset.y;
    if (rest >= 0) return;
    top.current = rest;
    // LegendList stops a scroll at the insets it knows of, and iOS's own is not one of them.
    list.current?.reportContentInset({ top: -rest });
  };
  return { top, onScroll };
}
