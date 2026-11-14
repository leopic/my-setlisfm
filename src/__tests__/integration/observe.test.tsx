import { renderRouter, screen } from 'expo-router/testing-library';
import AppMetrics from 'expo-app-metrics';
import { seedDatabase } from '../../../test/database';

beforeAll(seedDatabase);

it('marks the app interactive once the root layout is ready', async () => {
  const markInteractive = jest.spyOn(AppMetrics, 'markInteractive');

  await renderRouter('./app', { initialUrl: '/' });
  expect(await screen.findByTestId('dashboard-screen')).toBeOnTheScreen();

  // The expo-router integration is on, so Time to Interactive carries the route it was
  // recorded on. Without the integration it would fall back to a call with no routeName.
  expect(markInteractive).toHaveBeenCalledTimes(1);
  expect(markInteractive).toHaveBeenCalledWith(
    expect.objectContaining({ routeName: expect.any(String) }),
  );
});
