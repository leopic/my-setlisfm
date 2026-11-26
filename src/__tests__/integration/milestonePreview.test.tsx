import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { inLinkPreview, rowMenuActions } from '../../../test/screen';
import { TimelineMilestoneEntry, useTimelineStyles } from '@/components/dashboard/TimelineEntries';

// A milestone is every 50th show, and the seed has fewer, so the dashboard never shows one in
// the app tests. Render the row on its own, next to a stand-in setlist route.
const milestone = {
  number: 50,
  setlistId: 'set-50',
  artistName: 'Radiohead',
  eventDate: '15-03-2024',
  venueName: 'Madison Square Garden',
  cityName: 'New York',
  artistMbid: 'artist-1',
  venueId: 'venue-1',
};

function Timeline() {
  const styles = useTimelineStyles();
  return <TimelineMilestoneEntry milestone={milestone} styles={styles} />;
}

it('peeks at the setlist from a milestone row and opens it', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    index: Timeline,
    '(home)/concert/[id]': () => <Text>Setlist set-50</Text>,
  });

  const row = await screen.findByLabelText(/^50TH SHOW: Radiohead/);
  expect(inLinkPreview(row)).toBe(true);
  expect(row.props.role).toBe('button');
  // A milestone is a concert: the same menu opens its artist and venue.
  expect(rowMenuActions(row).map((action) => action.title)).toEqual(['Open artist', 'Open venue']);

  await fireEvent.press(row);
  expect(await screen.findByText('Setlist set-50')).toBeOnTheScreen();
  expect(screen).toHaveSegments(['(home)', 'concert', '[id]']);
});
