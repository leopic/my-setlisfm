import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

// Jest has no layout engine, so virtualized lists (LegendList) see a 0×0
// viewport and render no rows, and rows that never report a size stay hidden
// and untappable. Hand every list a phone-sized frame, then size its rows.
const FRAME = { x: 0, y: 0, width: 390, height: 844 };
const ROW = { x: 0, y: 0, width: 390, height: 80 };

export async function layOutLists() {
  for (const list of screen.container.queryAll((n) => n.type === 'RCTScrollView')) {
    await fireEvent(list, 'layout', { nativeEvent: { layout: FRAME } });
    for (const child of list.queryAll((n) => n !== list && !!n.props.onLayout)) {
      await fireEvent(child, 'layout', { nativeEvent: { layout: ROW } });
    }
  }
}

// Screens further down a stack, and other tabs, stay mounted (hidden from
// accessibility). Wait for the screen to be the visible one, then scope
// queries to it.
export async function findScreen(testID: string) {
  const found = await waitFor(() => {
    const match = screen.getByTestId(testID);
    expect(match).toBeVisible();
    return match;
  });
  await layOutLists();
  return within(found);
}

export async function launchApp() {
  await renderRouter('./app', { initialUrl: '/' });
  await screen.findByTestId('dashboard-screen');
}

// The tab bar is native and not rendered under Jest; switch tabs the way a
// tab press does, through the router.
export async function openTab(tab: '(concerts)' | '(artists)' | '(venues)' | '(stats)') {
  await act(async () => router.navigate(`/(tabs)/${tab}`));
}

export async function goBackFrom(testID: string) {
  const current = await findScreen(testID);
  await fireEvent.press(current.getByTestId('back-button'));
  await waitFor(() => expect(screen.queryByTestId(testID)).not.toBeOnTheScreen());
}
