import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

// Jest has no layout engine, so virtualized lists (LegendList) see a 0×0
// viewport and render no rows, and rows that never report a size stay hidden
// and untappable. Hand every list a phone-sized frame, then size its rows.
const FRAME = { x: 0, y: 0, width: 390, height: 844 };
const ROW = { x: 0, y: 0, width: 390, height: 80 };

export async function layOutLists() {
  // Only scroll views that measure themselves; layout events don't bubble in React Native,
  // so firing one on a plain ScrollView would just land on whatever ancestor listens.
  const lists = screen.container.queryAll((n) => n.type === 'RCTScrollView' && !!n.props.onLayout);
  for (const list of lists) {
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

type TreeNode = { type: unknown; parent: TreeNode | null };

/** True when the row sits inside a Link with Link.Preview (see integration.setup.ts). */
export const inLinkPreview = (row: TreeNode) => {
  for (let node = row.parent; node; node = node.parent) {
    if (node.type === 'NativeLinkPreview') return true;
  }
  return false;
};

type HostNode = { type: unknown; props: Record<string, unknown>; children: (HostNode | string)[] };

/**
 * The native header a screen asked for, found by its title. Under Jest a native-stack header
 * renders as a host element with the options as props (title, largeTitle...), and no text.
 */
export const findNativeHeader = (title: string) => {
  const walk = (node: HostNode | string): HostNode | undefined => {
    if (typeof node === 'string') return undefined;
    if (node.type === 'RNSScreenStackHeaderConfig' && node.props.title === title) return node;
    for (const child of node.children) {
      const found = walk(child);
      if (found) return found;
    }
    return undefined;
  };
  return walk(screen.root as unknown as HostNode);
};
