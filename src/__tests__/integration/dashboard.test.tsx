import { renderRouter, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';

beforeAll(seedDatabase);

it('opens the dashboard with the stored concert history', async () => {
  renderRouter('./app', { initialUrl: '/' });
  expect(await screen.findByTestId('dashboard-screen')).toBeOnTheScreen();
  expect(await screen.findByText('8 shows · 5 artists · 3 countries')).toBeOnTheScreen();
});
