import { waitFor } from 'expo-router/testing-library';
import { dbOperations } from '@/database/operations';
import { seedDatabase } from '../../../test/database';
import { findNativeHeader, headerSearchBar, inTab, launchApp, openTab } from '../../../test/screen';

let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

// Each list tab: its route, tab label, native title, and the query that holds it in loading.
const tabs = [
  {
    tab: 'artists',
    label: 'Artists',
    title: 'Artists',
    load: 'getArtistsWithStats',
    search: 'Search artists...',
  },
  {
    tab: 'venues',
    label: 'Venues',
    title: 'Venues',
    load: 'getVenuesWithStats',
    search: 'Search venues, cities, countries...',
  },
  {
    tab: 'concerts',
    label: 'Concerts',
    title: 'My Concerts',
    load: 'getAllSetlists',
    search: 'Search by artist, venue, city...',
  },
] as const;

// The phone shows the native title while the list loads, so the title doesn't pop in when
// the rows arrive. The skeleton's rows scroll under it, like the list that follows.
describe.each(tabs)('$tab loading', ({ tab, label, title, load, search }) => {
  // Held for the test only; restoreAllMocks would also undo the setup's console.warn filter.
  let held: jest.SpyInstance;
  beforeEach(() => {
    held = jest.spyOn(dbOperations, load).mockReturnValue(new Promise<never>(() => {}));
  });
  afterEach(() => held.mockRestore());

  it('sits under the large title on a phone', async () => {
    mockIsTablet = false;
    await launchApp();
    await openTab(`(${tab})`);
    await waitFor(() => expect(inTab(label, 'loading-skeleton-scroll')).toHaveLength(1));
    expect(inTab(label, 'loading-skeleton-scroll')[0]).toHaveProp(
      'contentInsetAdjustmentBehavior',
      'automatic',
    );
    expect(findNativeHeader(title)?.props).toMatchObject({ largeTitle: true, hidden: false });
  });

  // The native search bar is laid out with the first scroll view (see HeaderSearchBar).
  it('has the native search bar on a phone', async () => {
    mockIsTablet = false;
    await launchApp();
    await openTab(`(${tab})`);
    await waitFor(() => expect(inTab(label, 'loading-skeleton-scroll')).toHaveLength(1));
    expect(headerSearchBar(search)).toBeDefined();
  });

  it('keeps its own header on iPad', async () => {
    mockIsTablet = true;
    await launchApp();
    await openTab(`(${tab})`);
    await waitFor(() => expect(inTab(label, 'loading-skeleton')).toHaveLength(1));
    expect(inTab(label, 'loading-skeleton-scroll')).toHaveLength(0);
    expect(findNativeHeader(title)).toBeUndefined();
  });
});
