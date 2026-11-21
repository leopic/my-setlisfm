import { renderRouter, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';

beforeAll(seedDatabase);

it('opens the dashboard with the stored concert history', async () => {
  await renderRouter('./app', { initialUrl: '/' });
  expect(await screen.findByTestId('dashboard-screen')).toBeOnTheScreen();
  expect(await screen.findByText('8 shows · 5 artists · 3 countries')).toBeOnTheScreen();
});

it('says when the last sync was the way a person would', async () => {
  await renderRouter('./app', { initialUrl: '/' });
  // The seed's sync is from Mar 20, 2025 at noon UTC, so it's named by its day: Mar 21 in
  // time zones from UTC+12.
  expect(await screen.findByText(/^Synced on Mar 2[01], 2025$/)).toBeOnTheScreen();
});
