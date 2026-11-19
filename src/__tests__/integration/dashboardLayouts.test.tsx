import { StyleSheet } from 'react-native';
import { fireEvent, screen, within } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { launchApp } from '../../../test/screen';
import { formatDate } from '@/utils/date';

// Each test picks the layout; the mock reads the flag when the hook runs.
let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

// Seed: 4 shows in 2024 (Mar, Jun, Sep, Nov) and 4 in 2025 (Jan, Feb, Mar, May).
// Nothing here depends on today's date: the seed has no show on this day and no milestone
// besides the first show, which the "first concert" entry already covers.

type Instance = ReturnType<typeof screen.getByText>;

type DotState = 'empty' | 'peak' | 'full';

// The 12 month dots in a year chapter, January first.
function monthDots(chapter: Instance): DotState[] {
  const dotStyle = (node: Instance) => StyleSheet.flatten(node.props.style) ?? {};
  return chapter
    .queryAll((node) => [3.5, 4].includes(dotStyle(node).borderRadius))
    .map((dot) => {
      const style = dotStyle(dot);
      if (style.borderRadius === 4) return 'peak';
      return style.opacity === 0.45 ? 'full' : 'empty';
    });
}

describe('phone layout', () => {
  beforeEach(async () => {
    mockIsTablet = false;
    await launchApp();
  });

  it('shows every year on the timeline, newest first, with its show count', async () => {
    expect(await screen.findByText('2025')).toBeOnTheScreen();
    expect(screen.getByText('2024')).toBeOnTheScreen();
    expect(screen.getAllByText(/^20\d\d$/).map((node) => node.props.children)).toEqual([
      '2025',
      '2024',
    ]);
    expect(screen.getAllByText('4 shows')).toHaveLength(2);
  });

  it('puts the most recent and first concert on the timeline', async () => {
    const mostRecent = await screen.findByLabelText(
      `Most recent, The Strokes, ${formatDate('10-05-2025')}`,
    );
    expect(within(mostRecent).getByText('The Strokes')).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`First concert, Radiohead, ${formatDate('15-03-2024')}`),
    ).toBeOnTheScreen();
  });

  it('marks the months with shows in the dot row of a year', async () => {
    const chapter = (await screen.findByText('2024')).parent;
    expect(chapter).not.toBeNull();
    expect(monthDots(chapter as Instance)).toEqual([
      'empty',
      'empty',
      'peak',
      'empty',
      'empty',
      'peak',
      'empty',
      'empty',
      'peak',
      'empty',
      'peak',
      'empty',
    ]);
  });
});

describe('tablet layout', () => {
  beforeEach(async () => {
    mockIsTablet = true;
    await launchApp();
  });

  it('shows a tile per year and the newest year in the panel', async () => {
    expect(await screen.findByLabelText('2025, 4 shows')).toBeOnTheScreen();
    expect(screen.getByLabelText('2024, 4 shows')).toBeOnTheScreen();
    // Tile and panel heading.
    expect(screen.getAllByText('2025')).toHaveLength(2);
    expect(screen.getAllByText('2024')).toHaveLength(1);
  });

  it('opens an older year in the panel with its stats and highlights', async () => {
    await fireEvent.press(await screen.findByLabelText('2024, 4 shows'));

    // Tile and panel heading.
    expect(await screen.findAllByText('2024')).toHaveLength(2);
    expect(screen.getAllByText('2025')).toHaveLength(1);

    // Stat cards: shows, countries, cities, peak month count.
    expect(screen.getByText('4')).toBeOnTheScreen();
    expect(screen.getAllByText('3')).toHaveLength(2);
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('countries')).toBeOnTheScreen();

    // Radiohead (first concert) shows as a highlight and in the year's show list.
    expect(screen.getByText('HIGHLIGHTS')).toBeOnTheScreen();
    expect(screen.getByText(formatDate('15-03-2024'))).toBeOnTheScreen();
    expect(screen.getAllByText('Radiohead')).toHaveLength(2);
  });
});
