import { screen, within } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

beforeAll(seedDatabase);

beforeEach(launchApp);

describe('with only the fixture', () => {
  // The fixture spans 2024–2025, a single era, which says no more than the weekday chart.
  it('leaves out the top day by era card', async () => {
    await openTab('(stats)');
    await findScreen('stats-screen');
    expect(screen.queryByTestId('weekday-eras-card')).not.toBeOnTheScreen();
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
