import { screen, waitFor } from 'expo-router/testing-library';
import { dbOperations } from '@/database/operations';
import { seedDatabase } from '../../../test/database';
import { findNativeHeader, launchApp, openTab } from '../../../test/screen';

let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);
afterEach(() => jest.restoreAllMocks());

// Each list tab: its route, tab label, native title, and the query that holds it in loading.
const tabs = [
  { tab: 'artists', label: 'Artists', title: 'Artists', load: 'getArtistsWithStats' },
  { tab: 'venues', label: 'Venues', title: 'Venues', load: 'getVenuesWithStats' },
  { tab: 'concerts', label: 'Concerts', title: 'My Concerts', load: 'getAllSetlists' },
] as const;

type Node = ReturnType<typeof screen.getByTestId>;

// Every tab is mounted under Jest, so a testID can match in several; keep the one in `label`.
const inTab = (label: string, testID: string) =>
  screen.queryAllByTestId(testID).filter((node) => {
    let parent: Node | null = node.parent;
    while (parent && parent.type !== 'RNSTabsScreenIOS') parent = parent.parent;
    return parent?.props.title === label;
  });

// The phone shows the native title while the list loads, so the title doesn't pop in when
// the rows arrive. The skeleton's rows scroll under it, like the list that follows.
describe.each(tabs)('$tab loading', ({ tab, label, title, load }) => {
  beforeEach(() => {
    jest.spyOn(dbOperations, load).mockReturnValue(new Promise(() => {}));
  });

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

  it('keeps its own header on iPad', async () => {
    mockIsTablet = true;
    await launchApp();
    await openTab(`(${tab})`);
    await waitFor(() => expect(inTab(label, 'loading-skeleton')).toHaveLength(1));
    expect(inTab(label, 'loading-skeleton-scroll')).toHaveLength(0);
    expect(findNativeHeader(title)).toBeUndefined();
  });
});
