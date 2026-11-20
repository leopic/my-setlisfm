import { StyleSheet } from 'react-native';
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, layOutLists, openTab } from '../../../test/screen';
import { formatDate } from '@/utils/date';
import { Space } from '@/utils/spacing';

// A timeline row's › arrow sits at the row's right edge. The row or a view around it must
// keep it one screen edge (20 pt) in: with nothing it is cut off, with two it sits 40 pt in.
// Jest has no layout, so this adds up the right padding and margin up to the screen.

// Each test picks the layout; the mock reads the flag when the hook runs.
let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

afterEach(() => {
  mockIsTablet = false;
});

type Instance = ReturnType<typeof screen.getByText>;

function rightInset(row: Instance) {
  let inset = 0;
  for (let node: Instance | null = row; node; node = node.parent) {
    if (String(node.props.testID ?? '').endsWith('-screen')) break;
    const style = StyleSheet.flatten(node.props.style) ?? {};
    const padding = style.paddingRight ?? style.paddingHorizontal ?? style.padding ?? 0;
    const margin = style.marginRight ?? style.marginHorizontal ?? style.margin ?? 0;
    inset += Number(padding) + Number(margin);
  }
  return inset;
}

describe('phone', () => {
  beforeEach(launchApp);

  it('keeps the arrow one edge in on the dashboard timeline', async () => {
    const row = await screen.findByLabelText(
      `Most recent, The Strokes, ${formatDate('10-05-2025')}`,
    );
    expect(rightInset(row)).toBe(Space.edge);
  });

  it('keeps the arrow one edge in on the concert list', async () => {
    await openTab('(concerts)');
    const concerts = await findScreen('concerts-screen');
    expect(rightInset(concerts.getByTestId('concert-set-1'))).toBe(Space.edge);
  });

  it('keeps the arrow one edge in on the artist and venue concert lists', async () => {
    await openTab('(artists)');
    const artists = await findScreen('artists-screen');
    await fireEvent.press(artists.getByTestId('artist-artist-1'));
    const artistConcerts = await findScreen('artist-concerts-screen');
    const [artistRow] = artistConcerts.getAllByRole('button', { name: /Columbiahalle/ });
    expect(rightInset(artistRow)).toBe(Space.edge);

    await act(async () =>
      router.navigate({ pathname: '/(venues)/concerts', params: { venue: 'venue-2' } }),
    );
    const venueConcerts = await findScreen('venue-concerts-screen');
    const [venueRow] = venueConcerts.getAllByRole('button', { name: /Radiohead/ });
    expect(rightInset(venueRow)).toBe(Space.edge);
  });
});

describe('tablet panes', () => {
  beforeEach(async () => {
    mockIsTablet = true;
    await launchApp();
  });

  it('keeps the arrow one edge in on the artist and venue panes', async () => {
    await openTab('(artists)');
    const artists = await findScreen('artists-screen');
    await fireEvent.press(artists.getByTestId('artist-artist-1'));
    await layOutLists();
    const artistRow = await artists.findByRole('button', { name: /^Mar 15, 2024, Madison/ });
    expect(rightInset(artistRow)).toBe(Space.edge);

    await openTab('(venues)');
    const venues = await findScreen('venues-screen');
    await fireEvent.press(venues.getByTestId('venue-venue-2'));
    await layOutLists();
    const [venueRow] = await venues.findAllByRole('button', { name: /, Kraftwerk, / });
    expect(rightInset(venueRow)).toBe(Space.edge);
  });
});
