import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import ArtistImage from '@/components/ArtistImage';
import ArtistRow from '@/components/artists/ArtistRow';
import { useArtistsStyles } from '@/components/artists/useArtistsStyles';
import CompactOnThisDayCard from '@/components/dashboard/CompactOnThisDayCard';
import ArtistDetailPane from '@/components/panes/ArtistDetailPane';
import ListSkeleton from '@/components/skeletons/ListSkeleton';
import { seedDatabase } from '../../../test/database';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ push: jest.fn() }),
}));

beforeAll(seedDatabase);

const photoWidth = async () => {
  const photo = await screen.findByTestId('artist-photo');
  return StyleSheet.flatten(photo.props.style).width;
};

// Artist photos come in three sizes, like the type scale.
describe('artist photo sizes', () => {
  it.each([
    ['inline', 32],
    ['row', 44],
    ['header', 56],
  ] as const)('draws a %s photo %i pt wide', async (size, width) => {
    await render(<ArtistImage mbid="artist-2" imageUrl="" size={size} />);
    expect(await photoWidth()).toBe(width);
  });

  it('uses the row size in the Artists list', async () => {
    function Row() {
      const styles = useArtistsStyles();
      return (
        <ArtistRow
          styles={styles}
          artist={{ mbid: 'artist-2', name: 'The Strokes', concertCount: 2, venues: [] }}
          index={0}
          isSelected={false}
          onPress={jest.fn()}
        />
      );
    }
    await render(<Row />);
    expect(await photoWidth()).toBe(44);
  });

  it('uses the inline size on the tablet on-this-day card', async () => {
    await render(
      <CompactOnThisDayCard
        variant="header"
        concert={{
          setlistId: 'setlist-2',
          artistName: 'The Strokes',
          eventDate: '2025-05-10',
          venueName: 'Madison Square Garden',
          yearsAgo: 1,
          artistMbid: 'artist-2',
          artistImageUrl: '',
          venueId: null,
        }}
      />,
    );
    expect(await photoWidth()).toBe(32);
  });

  it('uses the header size on the tablet artist pane', async () => {
    await render(<ArtistDetailPane artistMbid="artist-2" />);
    expect(await photoWidth()).toBe(56);
  });

  // The loading rows hold the photo's place, ring included, so the names don't move.
  it('keeps the photo and its ring free in the Artists loading rows', async () => {
    await render(<ListSkeleton variant="artists" cardCount={3} />);
    type Node = { props: { style?: unknown }; children: (Node | string)[] | null };
    const circles: Node[] = [];
    const walk = (node: Node | string) => {
      if (typeof node === 'string') return;
      const { width, height } = StyleSheet.flatten(node.props.style as never) ?? {};
      if (width === 48 && height === 48) circles.push(node);
      node.children?.forEach(walk);
    };
    walk(screen.toJSON() as Node);
    expect(circles).toHaveLength(3);
  });
});
