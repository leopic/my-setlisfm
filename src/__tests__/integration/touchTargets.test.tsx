import { StyleSheet, type ViewStyle } from 'react-native';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { seedDatabase } from '../../../test/database';
import ConcertsControls from '@/components/concerts/ConcertsControls';
import { useConcertsStyles } from '@/components/concerts/useConcertsStyles';
import HeaderActions from '@/components/dashboard/HeaderActions';
import { SearchInput } from '@/components/ui';
import VenueGeoStrip from '@/components/venues/VenueGeoStrip';
import { createVenueStyles } from '@/components/venues/venueStyles';
import { useChronicleColors } from '@/utils/colors';
import {
  findScreen,
  headerButtonLabels,
  launchApp,
  openTab,
  pressHeaderButton,
} from '../../../test/screen';

beforeAll(seedDatabase);

beforeEach(launchApp);

type Element = ReturnType<typeof screen.getByText>;

// Apple's Human Interface Guidelines: 44 × 44 pt. Not TOUCH_TARGET, so a smaller constant fails.
const MIN = 44;

// Jest has no layout, so check the size each control asks for. `agent-device audit` checks
// the real frames on a simulator.
const expectTouchTarget = (node: Element) => {
  const style = StyleSheet.flatten(node.props.style as ViewStyle) ?? {};
  const height = Math.max(Number(style.height ?? 0), Number(style.minHeight ?? 0));
  expect(height).toBeGreaterThanOrEqual(MIN);
  if (style.width !== undefined) expect(Number(style.width)).toBeGreaterThanOrEqual(MIN);
};

// On a phone with data, sync and settings are native header buttons, which iOS sizes.
it('puts the dashboard icons in the native header on a phone', async () => {
  await findScreen('dashboard-screen');
  expect(headerButtonLabels('Chronicles').sort()).toEqual(['Open settings', 'Sync concert data']);
});

// The empty state and the iPad draw them in their own top bar.
it('gives the top bar icons 44 pt targets', async () => {
  await renderRouter({ index: () => <HeaderActions onSync={() => {}} /> });
  expectTouchTarget(screen.getByLabelText('Sync concert data'));
  expectTouchTarget(screen.getByLabelText('Open settings'));
});

// On an iPhone the search fields are native, under the large title; iOS sizes them.
it('gives the concerts sort pills 44 pt targets', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  for (const label of ['Most Recent', 'By Name']) {
    expectTouchTarget(concerts.getByLabelText(label));
  }
});

// On an iPhone the year filter is a header menu (iOS sizes it); the iPad and Android keep the pill.
it('gives the concerts year pill a 44 pt target', async () => {
  function Controls() {
    return (
      <ConcertsControls
        styles={useConcertsStyles()}
        searchQuery=""
        onSearchChange={() => {}}
        years={['2024']}
        yearFilter={null}
        yearDropdownOpen={false}
        onOpenYearDropdown={() => {}}
        onCloseYearDropdown={() => {}}
        onSelectYear={() => {}}
        sortOption="recent"
        onSortChange={() => {}}
      />
    );
  }
  await renderRouter({ index: Controls });
  expectTouchTarget(screen.getByLabelText('Filter by year'));
});

it('gives the artists sort pills 44 pt targets', async () => {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');
  for (const label of ['Most Recent', 'Top', 'By Name']) {
    expectTouchTarget(artists.getByLabelText(label));
  }
});

it('gives the venues sort pills 44 pt targets', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  for (const name of ['Most Recent', 'Top', 'By Name']) {
    expectTouchTarget(venues.getByRole('button', { name }));
  }
});

// On an iPhone these are a header menu; the iPad and Android keep them in the list.
it('gives the venues geo buttons 44 pt targets', async () => {
  const geoStats = { totalContinents: 2, totalCountries: 3, totalCities: 3 };
  function Strip() {
    const styles = createVenueStyles(useChronicleColors());
    return (
      <VenueGeoStrip
        styles={styles}
        geoStats={{ ...geoStats, continents: [], countries: [], cities: [] }}
      />
    );
  }
  await renderRouter({ index: Strip });
  for (const name of ['2 continents', '3 countries', '3 cities']) {
    expectTouchTarget(screen.getByRole('button', { name }));
  }
});

it('gives back buttons and the venue link 44 pt targets', async () => {
  await openTab('(venues)');
  await fireEvent.press((await findScreen('venues-screen')).getByTestId('venue-venue-1'));
  const venue = await findScreen('venue-concerts-screen');
  expectTouchTarget(venue.getByTestId('back-button'));
  expectTouchTarget(venue.getByTestId('venue-setlistfm-link'));

  await act(async () =>
    router.navigate({ pathname: '/(artists)/concerts', params: { artist: 'artist-1' } }),
  );
  expectTouchTarget((await findScreen('artist-concerts-screen')).getByTestId('back-button'));
});

it('gives the settings back button and "Change" 44 pt targets', async () => {
  await pressHeaderButton('Open settings');
  expectTouchTarget(await screen.findByTestId('back-button'));
  expectTouchTarget(screen.getByText('Change').parent as Element);
});

it('gives the username edit field, Save and Cancel 44 pt targets', async () => {
  await pressHeaderButton('Open settings');
  await fireEvent.press(await screen.findByText('Change'));
  const field = await screen.findByDisplayValue('e2e-seed');
  expectTouchTarget(field);
  // iOS reports a text field's frame inside its 1 pt border, so the field asks for 2 pt more
  // (the audit read a 44 pt field as 42).
  expect(StyleSheet.flatten(field.props.style as ViewStyle)?.minHeight).toBe(MIN + 2);
  expectTouchTarget(screen.getByRole('button', { name: 'Save' }));
  expectTouchTarget(screen.getByLabelText('Cancel'));
});

// The iPad and Android keep the search field in the list.
it('gives the search field and its clear button 44 pt targets', async () => {
  await renderRouter({
    index: () => <SearchInput value="x" onChangeText={() => {}} placeholder="Search" />,
  });
  expectTouchTarget(screen.getByPlaceholderText('Search'));
  expectTouchTarget(screen.getByLabelText('Clear search'));
});

it('gives the recognition badge on a setlist a 44 pt target', async () => {
  await openTab('(concerts)');
  await fireEvent.press((await findScreen('concerts-screen')).getByTestId('concert-set-1'));
  const setlist = await findScreen('setlist-screen');
  expectTouchTarget(setlist.getByTestId('back-button'));
  expectTouchTarget(await setlist.findByTestId('recognition-badge'));
});
