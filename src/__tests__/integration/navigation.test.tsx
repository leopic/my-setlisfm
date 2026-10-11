import { fireEvent, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, goBackFrom, launchApp, openTab } from '../../../test/screen';

// Headless counterparts of the seeded Maestro flows (.maestro/02–06), on the
// same fixture. Rows are picked by id rather than position so a sort change
// doesn't silently retarget a test.
beforeAll(seedDatabase);

beforeEach(launchApp);

it('concerts → setlist → back', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByTestId('concert-set-8'));

  const setlist = await findScreen('setlist-screen');
  expect(setlist.getByText('The Strokes')).toBeOnTheScreen();
  expect(setlist.getByText('Hard to Explain')).toBeOnTheScreen();

  await goBackFrom('setlist-screen');
  expect(screen).toHaveSegments(['(tabs)', '(concerts)']);
});

it('artists → artist concerts → setlist → back chain', async () => {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');
  await fireEvent.press(artists.getByTestId('artist-artist-2'));

  const artistConcerts = await findScreen('artist-concerts-screen');
  await fireEvent.press(artistConcerts.getByTestId('artist-concert-set-8'));

  const setlist = await findScreen('setlist-screen');
  expect(setlist.getByText('Someday')).toBeOnTheScreen();

  await goBackFrom('setlist-screen');
  await goBackFrom('artist-concerts-screen');
  expect(screen).toHaveSegments(['(tabs)', '(artists)']);
});

it('venues → venue concerts → setlist → back chain', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  await fireEvent.press(venues.getByTestId('venue-venue-2'));

  const venueConcerts = await findScreen('venue-concerts-screen');
  await fireEvent.press(venueConcerts.getByTestId('venue-concert-set-6'));

  const setlist = await findScreen('setlist-screen');
  expect(setlist.getByText('Kraftwerk')).toBeOnTheScreen();

  await goBackFrom('setlist-screen');
  await goBackFrom('venue-concerts-screen');
  expect(screen).toHaveSegments(['(tabs)', '(venues)']);
});

it('venues → countries → back', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  await fireEvent.press(venues.getByTestId('nav-countries'));

  const countries = await findScreen('countries-screen');
  expect(countries.getByText('Germany')).toBeOnTheScreen();

  await goBackFrom('countries-screen');
  expect(screen).toHaveSegments(['(tabs)', '(venues)']);
});

it('venues → continents → continent detail → back chain', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  await fireEvent.press(venues.getByTestId('nav-continents'));

  const continents = await findScreen('continents-screen');
  await fireEvent.press(continents.getByTestId('continent-Europe'));
  expect(screen).toHaveSegments(['(tabs)', '(venues)', 'continent-detail']);

  // Continent detail has no screen testID; its back button is the topmost one.
  const backButtons = await screen.findAllByTestId('back-button');
  await fireEvent.press(backButtons[backButtons.length - 1]);
  await goBackFrom('continents-screen');
  expect(screen).toHaveSegments(['(tabs)', '(venues)']);
});
