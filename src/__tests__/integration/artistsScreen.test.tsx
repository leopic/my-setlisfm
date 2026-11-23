import { fireEvent, screen, within } from 'expo-router/testing-library';
import { render, renderHook } from '@testing-library/react-native';
import { useChronicleColors } from '@/utils/colors';
import ArtistRow from '@/components/artists/ArtistRow';
import { useArtistsStyles } from '@/components/artists/useArtistsStyles';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import {
  findNativeHeader,
  findScreen,
  launchApp,
  layOutLists,
  openTab,
} from '../../../test/screen';

// Flipped per test: the phone layout is the default, the tablet one shows the detail pane.
let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

afterEach(() => {
  mockIsTablet = false;
});

beforeEach(launchApp);

const ARTIST = {
  mbid: 'artist-x',
  name: 'Test Artist',
  concertCount: 4,
  venues: ['One', 'Two', 'Three', 'Four', 'Five'],
};

function RowWithStyles({ index, isSelected }: { index: number; isSelected: boolean }) {
  const styles = useArtistsStyles();
  return (
    <ArtistRow
      styles={styles}
      artist={ARTIST}
      index={index}
      isSelected={isSelected}
      onPress={jest.fn()}
    />
  );
}

// The jest color scheme is light. Read before any test launches the app: a hook render
// next to a launched app gives two navigation containers.
let accentSoft: string;
beforeAll(async () => {
  const { result, unmount } = await renderHook(() => useChronicleColors());
  accentSoft = result.current.accentSoft;
  await unmount();
});

async function openArtists() {
  await openTab('(artists)');
  return findScreen('artists-screen');
}

describe('with the fixture', () => {
  it('shows the title and the artist count', async () => {
    const artists = await openArtists();
    // The title is the native large title, which collapses into the bar on scroll.
    expect(findNativeHeader('Artists')?.props).toMatchObject({ largeTitle: true, hidden: false });
    expect(artists.getByText('5 artists')).toBeOnTheScreen();
    // Without the automatic inset the list starts under the bar and the title never collapses.
    // Without overflow scrolling React Native stops a scroll to the list's top at 0.
    const list = artists.getByTestId('artists-list');
    expect(list).toHaveProp('contentInsetAdjustmentBehavior', 'automatic');
    expect(list).toHaveProp('scrollToOverflowEnabled', true);
  });

  it('shows an artist row with its details', async () => {
    const artists = await openArtists();
    const row = artists.getByTestId('artist-artist-1');
    expect(row).toHaveAccessibleName('Radiohead, 2 shows');
    expect(row.props.accessibilityHint).toBe('View concerts for this artist');
    expect(within(row).getByText('Radiohead')).toBeOnTheScreen();
    expect(within(row).getByText(/^Last seen: /)).toBeOnTheScreen();
    expect(within(row).getByText('2')).toBeOnTheScreen();
    expect(within(row).getByTestId('row-chevron', { includeHiddenElements: true })).toBeTruthy();
  });

  it('lists the venues of an artist on one line', async () => {
    const artists = await openArtists();
    const withComma = within(artists.getByTestId('artist-artist-2')).getAllByText(/,/);
    expect(withComma.some((node) => node.props.numberOfLines === 1)).toBe(true);
  });

  it('filters the list by the search text', async () => {
    const artists = await openArtists();
    await fireEvent.changeText(artists.getByLabelText('Search artists...'), 'strokes');
    expect(artists.getByTestId('artist-artist-2')).toBeOnTheScreen();
    expect(artists.queryByTestId('artist-artist-1')).not.toBeOnTheScreen();
  });

  it('says so when no artist matches the search', async () => {
    const artists = await openArtists();
    await fireEvent.changeText(artists.getByLabelText('Search artists...'), 'zzz');
    expect(await artists.findByText('No artists match your search')).toBeOnTheScreen();
    expect(artists.getByText('Try a different search term')).toBeOnTheScreen();
  });

  it('marks the active sort pill and rewords the subtitle for the top sort', async () => {
    const artists = await openArtists();
    expect(artists.getByLabelText('Most Recent')).toBeSelected();
    expect(artists.getByLabelText('Top')).not.toBeSelected();
    expect(artists.getByLabelText('By Name')).not.toBeSelected();

    await fireEvent.press(artists.getByLabelText('Top'));

    expect(artists.getByLabelText('Top')).toBeSelected();
    expect(artists.getByLabelText('Most Recent')).not.toBeSelected();
    expect(artists.getByText('5 artists (sorted by concert count)')).toBeOnTheScreen();

    await fireEvent.press(artists.getByLabelText('By Name'));

    expect(artists.getByLabelText('By Name')).toBeSelected();
    expect(artists.getByLabelText('Top')).not.toBeSelected();
    expect(artists.getByText('5 artists')).toBeOnTheScreen();

    await fireEvent.press(artists.getByLabelText('Most Recent'));

    expect(artists.getByLabelText('Most Recent')).toBeSelected();
    expect(artists.getByLabelText('By Name')).not.toBeSelected();
  });

  it('opens the artist concerts on a phone', async () => {
    const artists = await openArtists();
    await fireEvent.press(artists.getByTestId('artist-artist-2'));
    expect(await findScreen('artist-concerts-screen')).toBeTruthy();
  });
});

describe('on a tablet', () => {
  it('highlights the selected artist row once the row redraws', async () => {
    mockIsTablet = true;
    const artists = await openArtists();
    await fireEvent.press(artists.getByTestId('artist-artist-1'));
    // A row redraws only when it moves, so re-sorting is what shows the highlight.
    await fireEvent.press(artists.getByLabelText('Top'));
    await layOutLists();

    expect(artists.getByTestId('artist-artist-1')).toHaveStyle({ backgroundColor: accentSoft });
    expect(artists.getByTestId('artist-artist-2')).not.toHaveStyle({
      backgroundColor: accentSoft,
    });
  });

  // A screen's header options outlive the branch that set them, so the tablet layout turns
  // the phone's large title off again. Its own header sits above the sidebar list.
  it('drops the large title when the layout turns into the tablet one', async () => {
    const artists = await openArtists();
    expect(findNativeHeader('Artists')?.props.hidden).toBe(false);
    mockIsTablet = true;
    await fireEvent.press(artists.getByLabelText('Top'));

    expect(findNativeHeader('Artists')?.props.hidden).toBe(true);
    expect(artists.getByText('Artists')).toBeOnTheScreen();
    const list = artists.getByTestId('artists-list');
    expect(list).not.toHaveProp('contentInsetAdjustmentBehavior', 'automatic');
    expect(list).not.toHaveProp('scrollToOverflowEnabled', true);
  });
});

describe('without artists', () => {
  // Deletes the setlists of the shared DB and never restores them: keep this block last.
  const deleteSetlists = () => {
    const db = getTestDatabase();
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM setlists');
  };

  // A screen's header options outlive the branch that set them, so the empty state turns the
  // large title off again, as after "Clear All Data". Its own header shows the title.
  it('drops the large title when the last artist goes away', async () => {
    await openArtists();
    expect(findNativeHeader('Artists')?.props.hidden).toBe(false);
    deleteSetlists();
    await openTab('(concerts)');
    const artists = await openTab('(artists)').then(() => findScreen('artists-screen'));

    expect(await artists.findByText('No artists yet')).toBeOnTheScreen();
    expect(findNativeHeader('Artists')?.props.hidden).toBe(true);
  });

  it('shows the full-page empty state with the title alone', async () => {
    deleteSetlists();
    const artists = await openArtists();
    expect(artists.getByText('Artists')).toBeOnTheScreen();
    expect(artists.getByText('No artists yet')).toBeOnTheScreen();
    expect(artists.queryByLabelText('Search artists...')).not.toBeOnTheScreen();
    expect(artists.queryByLabelText('Top')).not.toBeOnTheScreen();
    expect(artists.queryByText(/^\d+ artists?$/)).not.toBeOnTheScreen();
  });
});

describe('ArtistRow', () => {
  // The screen's list redraws a row only when it moves (sort, search, reload), not when
  // the selection changes, so the highlight is checked on the row itself.
  it('highlights the selected row', async () => {
    await render(<RowWithStyles index={5} isSelected />);
    expect(screen.getByTestId('artist-artist-x')).toHaveStyle({
      backgroundColor: accentSoft,
    });
  });

  it('leaves an unselected row without a highlight', async () => {
    await render(<RowWithStyles index={5} isSelected={false} />);
    expect(screen.getByTestId('artist-artist-x')).not.toHaveStyle({
      backgroundColor: accentSoft,
    });
  });

  it('adds an accent bar to the first two rows only', async () => {
    await render(<RowWithStyles index={1} isSelected={false} />);
    expect(screen.getByTestId('artist-artist-x')).toHaveStyle({ borderLeftWidth: 2.5 });
    await screen.unmount();
    await render(<RowWithStyles index={2} isSelected={false} />);
    expect(screen.getByTestId('artist-artist-x')).not.toHaveStyle({ borderLeftWidth: 2.5 });
  });

  it('cuts the venue list after three and counts the rest', async () => {
    await render(<RowWithStyles index={5} isSelected={false} />);
    expect(screen.getByText('One, Two, Three +2 more')).toBeOnTheScreen();
  });
});
