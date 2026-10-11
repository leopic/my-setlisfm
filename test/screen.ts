import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

// Jest has no layout engine, so virtualized lists (LegendList) see a 0×0
// viewport and render no rows, and rows that never report a size stay hidden
// and untappable. Hand every list a phone-sized frame, then size its rows.
const FRAME = { x: 0, y: 0, width: 390, height: 844 };
const ROW = { x: 0, y: 0, width: 390, height: 80 };

export function layOutLists() {
  for (const list of screen.UNSAFE_queryAllByType(ScrollView)) {
    fireEvent(list, 'layout', { nativeEvent: { layout: FRAME } });
    for (const child of list.findAll((n) => typeof n.type === 'string' && !!n.props.onLayout)) {
      if (child.props.onLayout !== list.props.onLayout) {
        fireEvent(child, 'layout', { nativeEvent: { layout: ROW } });
      }
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
  layOutLists();
  return within(found);
}

export async function launchApp() {
  renderRouter('./app', { initialUrl: '/' });
  await screen.findByTestId('dashboard-screen');
}

// The tab bar is native and not rendered under Jest; switch tabs the way a
// tab press does, through the router.
export function openTab(tab: '(concerts)' | '(artists)' | '(venues)') {
  act(() => router.navigate(`/(tabs)/${tab}`));
}

export async function goBackFrom(testID: string) {
  const current = await findScreen(testID);
  fireEvent.press(current.getByTestId('back-button'));
  await waitFor(() => expect(screen.queryByTestId(testID)).not.toBeOnTheScreen());
}
