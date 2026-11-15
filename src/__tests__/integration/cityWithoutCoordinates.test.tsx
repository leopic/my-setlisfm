import { router } from 'expo-router';
import { act, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { launchApp } from '../../../test/screen';

beforeAll(async () => {
  await seedDatabase();
  // A city stored with a latitude but no longitude (SQLite returns null, not undefined).
  getTestDatabase().exec(`UPDATE cities SET coordsLong = NULL WHERE name = 'New York';`);
});

beforeEach(launchApp);

it('opens a city that has only one coordinate without crashing', async () => {
  await act(async () =>
    router.navigate({
      pathname: '/(venues)/city-detail',
      params: { city: 'New York', country: 'United States' },
    }),
  );
  expect(await screen.findByText(/^United States · /)).toBeOnTheScreen();
  expect(screen.queryByText(/°N/)).not.toBeOnTheScreen();
});
