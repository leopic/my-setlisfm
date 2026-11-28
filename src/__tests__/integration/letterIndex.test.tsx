import { ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { LegendListRef } from '@legendapp/list/react-native';
import { ListLetterIndex } from '@/components/ui';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, layOutLists, openTab, pickSort } from '../../../test/screen';

// Flipped per test: the phone layout is the default.
let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

// Under Jest, ScrollView is React Native's mock: every instance shares one scrollTo jest.fn.
const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;

beforeEach(async () => {
  await launchApp();
  scrollTo.mockClear();
  jest.spyOn(Haptics, 'selectionAsync');
});

afterEach(() => {
  jest.restoreAllMocks();
  mockIsTablet = false;
});

const letters = (strip: ReturnType<typeof screen.getByTestId>) =>
  strip.queryAll((node) => node.type === 'Text').map((letter) => letter.props.children);

// Like the Music app's library: a list sorted by name gets an A–Z strip on its right.
describe.each([
  ['Concerts', '(concerts)', 'concerts-screen', 'Artist', ['A', 'D', 'K', 'R', 'T']],
  ['Artists', '(artists)', 'artists-screen', 'Name', ['A', 'D', 'K', 'R', 'T']],
  ['Venues', '(venues)', 'venues-screen', 'Name', ['A', 'C', 'M', 'O']],
] as const)('the %s list', (_name, tab, screenId, byName, expected) => {
  it('shows the A–Z strip only when sorted by name', async () => {
    await openTab(tab);
    const list = await findScreen(screenId);
    expect(list.queryByTestId('letter-index')).not.toBeOnTheScreen();

    await pickSort(byName);

    expect(letters(list.getByTestId('letter-index'))).toEqual(expected);
  });

  // VoiceOver reads the strip as one adjustable control; each step jumps, with a tick.
  it('jumps to the next letter with a tick, as VoiceOver steps', async () => {
    await openTab(tab);
    const list = await findScreen(screenId);
    await pickSort(byName);
    await layOutLists();
    // Picking the order scrolled to the top already.
    scrollTo.mockClear();
    const strip = list.getByTestId('letter-index');
    expect(strip.props.accessibilityRole).toBe('adjustable');
    expect(strip.props.accessibilityLabel).toBe('Index');

    // Before any pick VoiceOver hears the first letter, so a step goes to the second.
    expect(strip.props.accessibilityValue).toEqual({ text: expected[0] });

    await fireEvent(strip, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });

    expect(list.getByTestId('letter-index').props.accessibilityValue).toEqual({
      text: expected[1],
    });
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    // The seed lists are shorter than the screen, so the jump itself is checked below.
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ animated: false }));
  });
});

it('shows the strip in the iPad sidebar too', async () => {
  mockIsTablet = true;
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');
  await fireEvent.press(artists.getByLabelText('By Name'));
  expect(artists.getByTestId('letter-index')).toBeOnTheScreen();
});

// Where a list with no large title above it jumps to.
const jumpTo = (index: number) => ({ index, animated: false, viewOffset: 0 });

// A letter jumps to its first row, in list order: '#' (digits sort first), then A to Z.
it('jumps the list to the first row of the letter', async () => {
  jest.spyOn(global, 'requestAnimationFrame');
  const scrollToIndex = jest.fn();
  const list = { current: { scrollToIndex } as unknown as LegendListRef };
  const names = ['2 Minutos', 'A Perfect Circle', 'AFI', 'Bad Religion', 'Björk', 'Cave In'];
  await renderRouter({
    index: () => <ListLetterIndex list={list} items={names} nameOf={(name) => name} />,
  });
  const strip = screen.getByTestId('letter-index');

  await fireEvent(strip, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(scrollToIndex).toHaveBeenLastCalledWith(jumpTo(1));
  await fireEvent(strip, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(scrollToIndex).toHaveBeenLastCalledWith(jumpTo(3));
  await fireEvent(strip, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(scrollToIndex).toHaveBeenLastCalledWith(jumpTo(5));
  await fireEvent(strip, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
  expect(scrollToIndex).toHaveBeenLastCalledWith(jumpTo(3));
  // No large title, no second jump.
  expect(scrollToIndex).toHaveBeenCalledTimes(4);
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

// Under a large title: aim the row past the title, and jump again once the first jump shut it.
it('aims past the large title the jump shuts', async () => {
  const scrollToIndex = jest.fn();
  const list = { current: { scrollToIndex } as unknown as LegendListRef };
  const names = ['AFI', 'Bad Religion'];
  await renderRouter({
    index: () => (
      <ListLetterIndex list={list} items={names} nameOf={(name) => name} top={{ current: -168 }} />
    ),
  });
  const strip = screen.getByTestId('letter-index');
  await fireEvent(strip, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(scrollToIndex).toHaveBeenLastCalledWith({ index: 1, animated: false, viewOffset: -66 });
  await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(2));
  expect(scrollToIndex).toHaveBeenLastCalledWith({ index: 1, animated: false, viewOffset: -66 });
});

// A drag past a letter before the next frame: only the letter it stops on jumps a second time.
it('drops the second jump of a letter the drag left', async () => {
  const scrollToIndex = jest.fn();
  const list = { current: { scrollToIndex } as unknown as LegendListRef };
  const names = ['AFI', 'Bad Religion', 'Cave In', 'Descendents'];
  await renderRouter({
    index: () => (
      <ListLetterIndex list={list} items={names} nameOf={(name) => name} top={{ current: -168 }} />
    ),
  });
  const strip = screen.getByTestId('letter-index');
  await fireEvent(strip, 'layout', { nativeEvent: { layout: { height: 116 } } });
  const at = (locationY: number) => ({ nativeEvent: { locationY } });
  await fireEvent(strip, 'responderGrant', at(40));
  await fireEvent(strip, 'responderMove', at(60));
  await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(3));
  expect(scrollToIndex.mock.calls.map(([{ index }]) => index)).toEqual([1, 2, 2]);
});

it('shows no strip for a list with one letter', async () => {
  const list = { current: null };
  await renderRouter({
    index: () => <ListLetterIndex list={list} items={['AFI', 'Alkaline Trio']} nameOf={(n) => n} />,
  });
  expect(screen.queryByTestId('letter-index')).not.toBeOnTheScreen();
});

// A drag along the strip picks the letter under the finger: one tick per new letter.
it('jumps to the letter under a drag', async () => {
  jest.spyOn(Haptics, 'selectionAsync');
  const scrollToIndex = jest.fn();
  const list = { current: { scrollToIndex } as unknown as LegendListRef };
  const names = ['AFI', 'Bad Religion', 'Cave In', 'Descendents'];
  await renderRouter({
    index: () => <ListLetterIndex list={list} items={names} nameOf={(name) => name} />,
  });
  const strip = screen.getByTestId('letter-index');
  // 4 letters between 8 pt paddings, 25 pt each.
  await fireEvent(strip, 'layout', { nativeEvent: { layout: { height: 116 } } });
  const at = (locationY: number) => ({ nativeEvent: { locationY } });

  await fireEvent(strip, 'responderGrant', at(60));
  expect(scrollToIndex).toHaveBeenLastCalledWith(jumpTo(2));
  await fireEvent(strip, 'responderMove', at(70));
  await fireEvent(strip, 'responderMove', at(100));
  expect(scrollToIndex).toHaveBeenLastCalledWith(jumpTo(3));
  await fireEvent(strip, 'responderMove', at(-30));
  expect(scrollToIndex).toHaveBeenLastCalledWith(jumpTo(0));
  expect(scrollToIndex).toHaveBeenCalledTimes(3);
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(3);
});
