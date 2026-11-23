import { Alert, StyleSheet } from 'react-native';
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { dbOperations } from '@/database/operations';
import * as syncService from '@/services/syncService';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import {
  findNativeHeader,
  findScreen,
  headerButtonLabels,
  inTab,
  launchApp,
  pressHeaderButton,
} from '../../../test/screen';
import { formatDate } from '@/utils/date';
import { Radius } from '@/utils/radius';

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
  return (
    chapter
      // Month dots are round, 7 pt, and 8 pt for the busiest month.
      .queryAll(
        (node) =>
          dotStyle(node).borderRadius === Radius.full && [7, 8].includes(dotStyle(node).width),
      )
      .map((dot) => {
        const style = dotStyle(dot);
        if (style.width === 8) return 'peak';
        return style.opacity === 0.45 ? 'full' : 'empty';
      })
  );
}

// iOS ties the large title to the first scroll view it sees, so the loading skeleton sits
// under it too; otherwise the dashboard opens with the title collapsed.
it('loads under the large title on a phone', async () => {
  mockIsTablet = false;
  const load = jest.spyOn(dbOperations, 'getDashboardStats').mockReturnValue(new Promise(() => {}));
  try {
    await renderRouter('./app', { initialUrl: '/' });
    await waitFor(() => expect(inTab('Dashboard', 'loading-skeleton-scroll')).toHaveLength(1));
    expect(inTab('Dashboard', 'loading-skeleton-scroll')[0]).toHaveProp(
      'contentInsetAdjustmentBehavior',
      'automatic',
    );
    expect(findNativeHeader('Chronicles')?.props).toMatchObject({
      largeTitle: true,
      hidden: false,
    });
  } finally {
    // Later tests load for real.
    load.mockRestore();
  }
});

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

describe('the large title', () => {
  beforeEach(async () => {
    mockIsTablet = false;
    await launchApp();
  });

  // The dashboard reloads after a sync; a sync that finds nothing new stands in for one.
  async function syncFromHeader() {
    jest
      .spyOn(syncService, 'syncConcertData')
      .mockResolvedValue({ success: true, newConcerts: 0, pagesProcessed: 0 });
    await pressHeaderButton('Sync concert data');
    jest.restoreAllMocks();
  }

  // The app's name is the native large title, which collapses into the bar as the timeline
  // scrolls. Without the automatic inset the timeline starts under the bar and the title
  // never collapses.
  it('is the native large title on a phone, with the timeline under it', async () => {
    const dashboard = await findScreen('dashboard-screen');
    expect(findNativeHeader('Chronicles')?.props).toMatchObject({
      largeTitle: true,
      hidden: false,
    });
    expect(headerButtonLabels('Chronicles').sort()).toEqual(['Open settings', 'Sync concert data']);
    expect(dashboard.getByTestId('dashboard-scroll')).toHaveProp(
      'contentInsetAdjustmentBehavior',
      'automatic',
    );
    expect(dashboard.getByText('8 shows · 5 artists · 3 countries')).toBeOnTheScreen();
  });

  it('syncs from the header button', async () => {
    const sync = jest
      .spyOn(syncService, 'syncConcertData')
      .mockResolvedValue({ success: true, newConcerts: 0, pagesProcessed: 0 });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    try {
      await findScreen('dashboard-screen');
      await pressHeaderButton('Sync concert data');
      expect(sync).toHaveBeenCalledWith('e2e-seed');
    } finally {
      jest.restoreAllMocks();
    }
  });

  // A screen's header options outlive the branch that set them, so the tablet layout turns
  // the phone's large title off again. Its own top bar shows the name and the buttons.
  it('drops the large title when the layout turns into the tablet one', async () => {
    await findScreen('dashboard-screen');
    expect(findNativeHeader('Chronicles')?.props.hidden).toBe(false);
    mockIsTablet = true;
    await syncFromHeader();
    const dashboard = await findScreen('dashboard-screen');

    expect(await dashboard.findByLabelText('2025, 4 shows')).toBeOnTheScreen();
    expect(dashboard.getByText('Chronicles')).toBeOnTheScreen();
    expect(dashboard.getByLabelText('Open settings')).toBeOnTheScreen();
    expect(findNativeHeader('Chronicles')?.props.hidden).toBe(true);
  });

  // The same for the empty state (a sync can find the history gone), whose top bar keeps the
  // sync button a new user needs.
  // Deletes the setlists of the shared DB and never restores them: keep this test last.
  it('drops the large title when the last concert goes away', async () => {
    await findScreen('dashboard-screen');
    expect(findNativeHeader('Chronicles')?.props.hidden).toBe(false);
    const db = getTestDatabase();
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM setlists');
    db.exec('PRAGMA foreign_keys = ON');
    await syncFromHeader();

    expect(await screen.findByText('Your chronicle starts here')).toBeOnTheScreen();
    expect(screen.getByText('Chronicles')).toBeOnTheScreen();
    expect(screen.getByLabelText('Sync concert data')).toBeOnTheScreen();
    expect(findNativeHeader('Chronicles')?.props.hidden).toBe(true);
  });
});
