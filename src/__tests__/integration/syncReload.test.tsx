import { act, screen, within } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

// A sync can end while another tab is open (start it on the dashboard, switch tabs). That
// tab must reload then, not only the next time it gets focus. The dashboard ends a sync with
// notifySyncComplete; keep the real one so the test can call it.
let mockNotifySyncComplete: () => void = () => {};
jest.mock('@/contexts/SyncContext', () => {
  const actual = jest.requireActual('@/contexts/SyncContext');
  return {
    ...actual,
    useSyncContext: () => {
      const context = actual.useSyncContext();
      mockNotifySyncComplete = context.notifySyncComplete;
      return context;
    },
  };
});

// The map is a native WebView, which Jest cannot load.
jest.mock('@/components/VenuesMapView', () => () => null);

beforeAll(seedDatabase);
beforeEach(async () => {
  getTestDatabase().exec(`
    DELETE FROM setlists WHERE id = 'set-new';
    DELETE FROM artists WHERE mbid = 'artist-new';
    DELETE FROM venues WHERE id = 'venue-new';
  `);
  await launchApp();
});

// What a sync writes: a new artist with one show, at a new venue in Berlin.
function addSyncedShow() {
  getTestDatabase().exec(`
    INSERT INTO artists (mbid, name, sortName) VALUES ('artist-new', 'Portishead', 'Portishead');
    INSERT INTO venues (id, name, cityId) VALUES ('venue-new', 'Tempodrom', 'city-2');
    INSERT INTO setlists (id, artistMbid, venueId, eventDate) VALUES ('set-new', 'artist-new', 'venue-new', '01-06-2025');
  `);
}

// The sync ends: notifySyncComplete stores Date.now(), which the test clock holds still.
async function endSync() {
  jest.setSystemTime(Date.now() + 60_000);
  await act(async () => mockNotifySyncComplete());
}

type Tab = '(concerts)' | '(artists)' | '(venues)' | '(stats)';

// The new show on each tab: a new row, or on stats the total-shows card going from 8 to 9.
const cases = [
  ['(concerts)', 'concerts-screen', 'Portishead'],
  ['(artists)', 'artists-screen', 'Portishead'],
  ['(venues)', 'venues-screen', 'Tempodrom'],
  ['(stats)', 'stats-screen', '9'],
] as const;

// Stats shows numbers, so read the one in the total-shows card, not any "9" on the screen.
async function showsNew(testID: string, added: string) {
  const current = await findScreen(testID);
  if (testID !== 'stats-screen') return current.queryByText(added) !== null;
  for (let node = current.getByText('total shows').parent; node; node = node.parent) {
    if (node.props.accessible === true) return within(node).queryByText(added) !== null;
  }
  return false;
}

it.each(cases)('reloads %s when a sync ends while it is open', async (tab, testID, added) => {
  await openTab(tab);
  expect(await showsNew(testID, added)).toBe(false);

  addSyncedShow();
  await endSync();

  // The reload reads the database asynchronously; its new rows need a layout to show.
  await act(async () => {});
  expect(await showsNew(testID, added)).toBe(true);
});

it.each(cases)('reloads %s when it gets focus again', async (tab, testID, added) => {
  await openTab(tab);
  expect(await showsNew(testID, added)).toBe(false);
  const other: Tab = tab === '(concerts)' ? '(artists)' : '(concerts)';
  await openTab(other);

  addSyncedShow();
  await openTab(tab);

  await act(async () => {});
  expect(screen.getByTestId(testID)).toBeVisible();
  expect(await showsNew(testID, added)).toBe(true);
});
