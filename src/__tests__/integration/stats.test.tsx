import { fireEvent, screen, within } from 'expo-router/testing-library';
import { dbOperations } from '@/database/operations';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findNativeHeader, findScreen, launchApp, openTab } from '../../../test/screen';

// Each test picks the layout; the mock reads the flag when the hook runs.
let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

// The map is a native WebView, which Jest cannot load.
jest.mock('@/components/VenuesMapView', () => () => null);

beforeAll(seedDatabase);

afterEach(() => {
  mockIsTablet = false;
});

beforeEach(launchApp);

// The large title shows while the charts load, so nothing moves when they arrive.
it('shows the large title while the charts load on a phone', async () => {
  const load = jest.spyOn(dbOperations, 'getYearSummaries').mockReturnValue(new Promise(() => {}));
  try {
    await openTab('(stats)');

    expect(await screen.findByTestId('stats-loading')).toHaveProp(
      'contentInsetAdjustmentBehavior',
      'automatic',
    );
    expect(findNativeHeader('Stats')?.props).toMatchObject({ largeTitle: true, hidden: false });
  } finally {
    // Later tests load for real.
    load.mockRestore();
  }
});

describe('with only the fixture', () => {
  // The fixture spans 2024–2025, a single era, which says no more than the weekday chart.
  it('leaves out the top day by era card', async () => {
    await openTab('(stats)');
    await findScreen('stats-screen');
    expect(screen.queryByTestId('weekday-eras-card')).not.toBeOnTheScreen();
  });
});

// Runs before the older concerts below are inserted into the shared database.
// Seed: 8 shows in 2024–25 across 3 countries; the first was Radiohead at Madison Square
// Garden, New York. Friday is the busiest day (3), 2024 ties 2025 on shows (the tie goes to
// 2024, the last of the newest-first year list), Germany leads with 50% of shows, Berlin is
// the most visited city.
describe('sections', () => {
  async function openStats() {
    await openTab('(stats)');
    return findScreen('stats-screen');
  }

  function expectSectionContent(stats: Awaited<ReturnType<typeof openStats>>) {
    // The summary line under the title
    expect(stats.getByText('8 shows · 3 countries')).toBeOnTheScreen();

    // Artists: the chart card shows only when there are artists to plot
    expect(stats.getByText('TOP 5 OVER TIME')).toBeOnTheScreen();

    // Your story: the milestone list, then the totals
    expect(stats.getByText('MILESTONES')).toBeOnTheScreen();
    expect(stats.getByText('1st')).toBeOnTheScreen();
    expect(stats.getByText('Madison Square Garden · New York')).toBeOnTheScreen();
    expect(stats.getByText('total shows')).toBeOnTheScreen();
    expect(stats.getByText('countries visited')).toBeOnTheScreen();

    // Concerts: both charts and the busiest year and day cards
    expect(stats.getByText('SHOWS PER YEAR')).toBeOnTheScreen();
    expect(stats.getByText('SHOWS BY DAY')).toBeOnTheScreen();
    expect(stats.getByText('busiest year · 4 shows')).toBeOnTheScreen();
    expect(stats.getByText('Friday')).toBeOnTheScreen();
    expect(stats.getByText('most common day · 3 shows')).toBeOnTheScreen();

    // Places: the world map card and the top country and city cards
    expect(stats.getByText('World Map')).toBeOnTheScreen();
    expect(stats.getByText('3 countries · tap to explore')).toBeOnTheScreen();
    expect(stats.getByText('Germany')).toBeOnTheScreen();
    expect(stats.getByText('50% of shows')).toBeOnTheScreen();
    expect(stats.getByText('Berlin')).toBeOnTheScreen();
    expect(stats.getByText('most visited city')).toBeOnTheScreen();
  }

  it('shows every section on a phone', async () => {
    const stats = await openStats();
    expectSectionContent(stats);
    // The title is the native large title, which collapses into the bar as the charts scroll.
    // Without the automatic inset the charts start under the bar and the title never collapses.
    expect(findNativeHeader('Stats')?.props).toMatchObject({ largeTitle: true, hidden: false });
    expect(stats.getByTestId('stats-scroll')).toHaveProp(
      'contentInsetAdjustmentBehavior',
      'automatic',
    );
    for (const label of ['ARTISTS', 'YOUR STORY', 'CONCERTS', 'PLACES']) {
      expect(stats.getByText(label)).toBeOnTheScreen();
    }
    expect(stats.queryByTestId('stats-column-left')).not.toBeOnTheScreen();
    expect(stats.queryByTestId('stats-column-right')).not.toBeOnTheScreen();
  });

  it('puts artists and story left, concerts and places right on a tablet', async () => {
    mockIsTablet = true;
    const stats = await openStats();
    expectSectionContent(stats);
    expect(stats.getByText('Stats')).toBeOnTheScreen();
    expect(findNativeHeader('Stats')?.props.hidden ?? true).toBe(true);
    const left = within(stats.getByTestId('stats-column-left'));
    const right = within(stats.getByTestId('stats-column-right'));
    expect(left.getByText('ARTISTS')).toBeOnTheScreen();
    expect(left.getByText('YOUR STORY')).toBeOnTheScreen();
    expect(left.queryByText('CONCERTS')).not.toBeOnTheScreen();
    expect(left.queryByText('PLACES')).not.toBeOnTheScreen();
    expect(right.getByText('CONCERTS')).toBeOnTheScreen();
    expect(right.getByText('PLACES')).toBeOnTheScreen();
    expect(right.queryByText('ARTISTS')).not.toBeOnTheScreen();
    expect(right.queryByText('YOUR STORY')).not.toBeOnTheScreen();
  });

  // A screen's header options outlive the branch that set them, so the tablet layout turns
  // the phone's large title off again. Its own header shows the title.
  it('drops the large title when the layout turns into the tablet one', async () => {
    await openStats();
    expect(findNativeHeader('Stats')?.props.hidden).toBe(false);
    mockIsTablet = true;
    await openTab('(artists)');
    const stats = await openStats();

    expect(await stats.findByTestId('stats-column-left')).toBeOnTheScreen();
    expect(stats.getByText('Stats')).toBeOnTheScreen();
    expect(findNativeHeader('Stats')?.props.hidden).toBe(true);
  });

  it('shows the earlier year of a tie as the busiest year', async () => {
    const stats = await openStats();
    expect(stats.getByText('2024')).toBeOnTheScreen();
    expect(stats.queryByText('2025')).not.toBeOnTheScreen();
  });

  it('shows the totals in the story cards', async () => {
    const stats = await openStats();
    expect(stats.getByText('8')).toBeOnTheScreen();
    expect(stats.getByText('3')).toBeOnTheScreen();
  });

  it('opens the world map from the map card', async () => {
    const stats = await openStats();
    await fireEvent.press(stats.getByLabelText('Open world map'));
    expect(await screen.findByText('Venues Map')).toBeOnTheScreen();
  });
});

describe('with older concerts', () => {
  // Two Saturdays and a Friday in 2012–13, then nothing until the fixture's 2024–25
  // (Fridays ×3, Saturdays ×2, Tuesdays ×2, Monday ×1). 2017–21 has no concerts, and a
  // concert without a usable date stays out of the eras.
  beforeAll(() => {
    getTestDatabase().exec(`
      INSERT INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES
        ('old-1', 'artist-1', 'venue-1', '14-04-2012', 'https://www.setlist.fm/setlist/old-1.html'),
        ('old-2', 'artist-2', 'venue-2', '06-10-2012', 'https://www.setlist.fm/setlist/old-2.html'),
        ('old-3', 'artist-3', 'venue-3', '13-09-2013', 'https://www.setlist.fm/setlist/old-3.html'),
        ('bad-1', 'artist-4', 'venue-4', '', 'https://www.setlist.fm/setlist/bad-1.html');
    `);
  });

  it("shows each era's top day and how many of its shows fell on it", async () => {
    await openTab('(stats)');
    const stats = await findScreen('stats-screen');
    expect(stats.getByTestId('weekday-eras-card')).toBeVisible();
    expect(stats.getByLabelText('2012–16: Sat, 2 of 3 shows')).toBeVisible();
    expect(stats.getByLabelText('2022–25: Fri, 3 of 8 shows')).toBeVisible();

    // The heatmap is hidden from screen readers (the timeline reads out each era)
    const hidden = { includeHiddenElements: true };
    expect(stats.getAllByTestId(/^era-row-/, hidden).map((row) => row.props.testID)).toEqual([
      'era-row-2012',
      'era-row-2022',
    ]);
    const saturday2012 = stats.getByTestId('era-cell-2012-6', hidden);
    expect(within(saturday2012).getByText('2', hidden)).toBeOnTheScreen();
    expect(saturday2012).toHaveStyle({ borderWidth: 1.5 });
    const friday2012 = stats.getByTestId('era-cell-2012-5', hidden);
    expect(within(friday2012).getByText('1', hidden)).toBeOnTheScreen();
    expect(friday2012).not.toHaveStyle({ borderWidth: 1.5 });
  });
});

describe('without concerts', () => {
  // A screen's header options outlive the branch that set them, so the empty state turns the
  // large title off again, as after "Clear All Data". Its own header shows the title.
  // Deletes the setlists of the shared DB and never restores them: keep this block last.
  it('drops the large title when the last concert goes away', async () => {
    await openTab('(stats)');
    await findScreen('stats-screen');
    expect(findNativeHeader('Stats')?.props.hidden).toBe(false);
    const db = getTestDatabase();
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM setlists');
    db.exec('PRAGMA foreign_keys = ON');
    await openTab('(artists)');
    await openTab('(stats)');

    expect(await screen.findByText('Nothing to chart yet')).toBeOnTheScreen();
    expect(screen.getByText('Stats')).toBeOnTheScreen();
    expect(findNativeHeader('Stats')?.props.hidden).toBe(true);
  });
});
