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
type TestNode = ReturnType<typeof screen.getByTestId>;

/**
 * The nodes with `testID` inside the tab labelled `label`. Every tab is mounted under Jest, so
 * a testID shared by several tabs (the loading skeletons) matches in each of them.
 */
export const inTab = (label: string, testID: string) =>
  screen.queryAllByTestId(testID).filter((node) => {
    let parent: TestNode | null = node.parent;
    while (parent && parent.type !== 'RNSTabsScreenIOS') parent = parent.parent;
    return parent?.props.title === label;
  });

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

type MenuNode = {
  type: unknown;
  props: Record<string, unknown>;
  parent: MenuNode | null;
  children: (MenuNode | string)[];
};

/**
 * The long-press menu actions of a row inside a Link with Link.Menu (see integration.setup.ts):
 * each action's title and a press that runs it, as choosing it in the iOS menu does.
 */
export const rowMenuActions = (row: ReturnType<typeof screen.getByTestId>) => {
  let link = (row as unknown as MenuNode).parent;
  while (link && link.type !== 'NativeLinkPreview') link = link.parent;
  const actions: MenuNode[] = [];
  const walk = (node: MenuNode | string) => {
    if (typeof node === 'string') return;
    if (node.type === 'NativeLinkPreviewAction') actions.push(node);
    node.children.forEach(walk);
  };
  if (link) walk(link);
  // Link.Menu is an action node too, holding its actions: keep the leaves.
  const leaves = actions.filter((action) => !actions.some((other) => other.parent === action));
  return leaves.map((action) => ({
    title: action.props.title as string,
    icon: action.props.icon as string | undefined,
    press: () => act(async () => (action.props.onSelected as () => void)()),
  }));
};

type HostNode = { type: unknown; props: Record<string, unknown>; children: (HostNode | string)[] };

/**
 * The native header a screen asked for, found by its title. Under Jest a native-stack header
 * renders as a host element with the options as props (title, largeTitle...), and no text.
 */
export const findNativeHeader = (title: string) =>
  findHeader((header) => header.props.title === title);

const findHeader = (matches: (header: HostNode) => boolean) => {
  const walk = (node: HostNode | string): HostNode | undefined => {
    if (typeof node === 'string') return undefined;
    if (node.type === 'RNSScreenStackHeaderConfig' && matches(node)) return node;
    for (const child of node.children) {
      const found = walk(child);
      if (found) return found;
    }
    return undefined;
  };
  return walk(screen.root as unknown as HostNode);
};

type HeaderItem = { accessibilityLabel?: string; buttonId: string };
const headerItems = (header: HostNode) => [
  ...((header.props.headerLeftBarButtonItems as HeaderItem[] | undefined) ?? []),
  ...((header.props.headerRightBarButtonItems as HeaderItem[] | undefined) ?? []),
];

/**
 * Taps a native header button (Stack.Toolbar) by its accessibility label. Under Jest these
 * are no elements of their own: the header holds them as items and calls one press handler
 * with the item's id, as iOS does.
 */
export async function pressHeaderButton(label: string) {
  const header = await waitFor(() => {
    const found = findHeader(
      (node) =>
        !node.props.hidden && headerItems(node).some((item) => item.accessibilityLabel === label),
    );
    if (!found) throw new Error(`No header button labelled "${label}"`);
    return found;
  });
  const item = headerItems(header).find((entry) => entry.accessibilityLabel === label);
  if (!item) throw new Error(`No header button labelled "${label}"`);
  const press = header.props.onPressHeaderBarButtonItem as (event: {
    nativeEvent: { buttonId: string };
  }) => void;
  await act(async () => press({ nativeEvent: { buttonId: item.buttonId } }));
}

type MenuAction = { title?: string; menuId: string };
type HeaderMenu = { accessibilityLabel?: string; menu?: { items: MenuAction[] } };

/**
 * Picks an action from a native header menu (Stack.Toolbar.Menu): the menu by its accessibility
 * label, the action by its title. As for buttons, the header holds the menu as an item and
 * calls one press handler with the action's id.
 */
export async function pressHeaderMenuItem(menuLabel: string, title: string) {
  const actionIn = (node: HostNode) =>
    (headerItems(node) as HeaderMenu[])
      .find((item) => item.accessibilityLabel === menuLabel)
      ?.menu?.items.find((action) => action.title === title);
  const header = await waitFor(() => {
    const found = findHeader((node) => !node.props.hidden && !!actionIn(node));
    if (!found) throw new Error(`No "${title}" in a header menu labelled "${menuLabel}"`);
    return found;
  });
  const action = actionIn(header);
  if (!action) throw new Error(`No "${title}" in a header menu labelled "${menuLabel}"`);
  const press = header.props.onPressHeaderBarButtonMenuItem as (event: {
    nativeEvent: { menuId: string };
  }) => void;
  await act(async () => press({ nativeEvent: { menuId: action.menuId } }));
}

type MenuActionState = MenuAction & { subtitle?: string; state?: 'on' | 'off' };

/** The actions of a native header menu, found by its label: title, subtitle and check mark. */
export const headerMenuActions = (menuLabel: string) => {
  const header = findHeader(
    (node) =>
      !node.props.hidden && headerItems(node).some((item) => item.accessibilityLabel === menuLabel),
  );
  const menu = (header ? (headerItems(header) as HeaderMenu[]) : []).find(
    (item) => item.accessibilityLabel === menuLabel,
  );
  return ((menu?.menu?.items ?? []) as MenuActionState[]).map((action) => ({
    title: action.title,
    subtitle: action.subtitle,
    on: action.state === 'on',
  }));
};

/** The labels of the native header buttons a screen shows, left to right as items. */
export const headerButtonLabels = (title: string) => {
  const header = findNativeHeader(title);
  return header ? headerItems(header).map((item) => item.accessibilityLabel) : [];
};

const findHostNode = (matches: (node: HostNode) => boolean) => {
  const walk = (node: HostNode | string): HostNode | undefined => {
    if (typeof node === 'string') return undefined;
    if (matches(node)) return node;
    for (const child of node.children) {
      const found = walk(child);
      if (found) return found;
    }
    return undefined;
  };
  return walk(screen.root as unknown as HostNode);
};

/**
 * The native search bar under a large title (Stack.SearchBar), found by its placeholder. Under
 * Jest it is a host element with the bar's props and no text field of its own.
 */
export const headerSearchBar = (placeholder: string) =>
  findHostNode((node) => node.type === 'RNSSearchBar' && node.props.placeholder === placeholder);

const waitForHeaderSearchBar = (placeholder: string) =>
  waitFor(() => {
    const found = headerSearchBar(placeholder);
    if (!found) throw new Error(`No header search bar "${placeholder}"`);
    return found;
  });

/** Types into the native search bar: iOS sends the whole text with each change. */
export async function typeInHeaderSearch(placeholder: string, text: string) {
  const bar = await waitForHeaderSearchBar(placeholder);
  const change = bar.props.onChangeText as (event: { nativeEvent: { text: string } }) => void;
  await act(async () => change({ nativeEvent: { text } }));
}

/** Taps Cancel next to the native search bar. */
export async function cancelHeaderSearch(placeholder: string) {
  const bar = await waitForHeaderSearchBar(placeholder);
  await act(async () => (bar.props.onCancelButtonPress as () => void)());
}
