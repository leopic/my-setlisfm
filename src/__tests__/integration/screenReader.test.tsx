import { screen, within } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, openTab } from '../../../test/screen';
import { formatDate } from '@/utils/date';

// What VoiceOver reads: a value goes with its label, charts and dot rows are spoken as one
// sentence, and decoration is skipped.

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

type Instance = ReturnType<typeof screen.getByText>;

// The element VoiceOver stops on for a text: the nearest view above it marked `accessible`.
function readWith(text: Instance) {
  for (let node = text.parent; node; node = node.parent) {
    if (node.props.accessible === true) return within(node);
  }
  throw new Error(`"${String(text.props.children)}" is read on its own`);
}

// Seed: 4 shows in 2024 (Mar, Jun, Sep, Nov) and 4 in 2025 (Jan, Feb, Mar, May), 3 countries
// and 3 cities each year. Friday is the top day.
describe('phone dashboard', () => {
  beforeEach(launchApp);

  it('makes each year a heading', async () => {
    expect(await screen.findByRole('header', { name: '2025' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: '2024' })).toBeOnTheScreen();
  });

  it('reads the month dots as the months with shows', async () => {
    expect(
      await screen.findByLabelText('Shows in January, February, March, May'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Shows in March, June, September, November')).toBeOnTheScreen();
  });

  it('reads a year stat with its label', async () => {
    const [countries] = await screen.findAllByText('countries');
    expect(readWith(countries).getByText('3')).toBeOnTheScreen();
  });

  it('reads each habit card on its own, not row by row across both', async () => {
    const topDay = readWith(await screen.findByText('TOP DAY'));
    expect(topDay.getByText('Friday')).toBeOnTheScreen();
    expect(topDay.getByText('3 concert days')).toBeOnTheScreen();
    expect(topDay.queryByText('BUSIEST WEEK')).not.toBeOnTheScreen();
  });
});

describe('stats', () => {
  beforeEach(launchApp);

  it('reads a stat card value with its label', async () => {
    await openTab('(stats)');
    const stats = await findScreen('stats-screen');
    expect(readWith(stats.getByText('total shows')).getByText('8')).toBeOnTheScreen();
    expect(readWith(stats.getByText('busiest year · 4 shows')).getByText('2024')).toBeOnTheScreen();
    expect(readWith(stats.getByText('50% of shows')).getByText('Germany')).toBeOnTheScreen();
  });

  it('spells out the charts, with full years and day names', async () => {
    await openTab('(stats)');
    const stats = await findScreen('stats-screen');
    expect(stats.getByRole('image', { name: '2024: 4 shows, 2025: 4 shows' })).toBeOnTheScreen();
    expect(
      stats.getByRole('image', {
        name: 'Monday: 1 show, Tuesday: 2 shows, Friday: 3 shows, Saturday: 2 shows',
      }),
    ).toBeOnTheScreen();
    // The artist lines are cumulative, so each one ends on that artist's total.
    expect(stats.getByRole('image', { name: /Radiohead: 2 shows/ })).toBeOnTheScreen();
  });
});

describe('tablet dashboard', () => {
  beforeEach(async () => {
    mockIsTablet = true;
    await launchApp();
  });

  it('reads the year stats and the monthly chart', async () => {
    const [countries] = await screen.findAllByText('countries');
    expect(readWith(countries).getByText('3')).toBeOnTheScreen();
    expect(
      screen.getByRole('image', {
        name: 'January: 1 show, February: 1 show, March: 1 show, May: 1 show',
      }),
    ).toBeOnTheScreen();
  });

  it('reads a highlight row without its arrow', async () => {
    expect(
      await screen.findByRole('button', {
        name: `The Strokes, Madison Square Garden · ${formatDate('10-05-2025')}`,
      }),
    ).toBeOnTheScreen();
  });
});
