import { Alert, type AlertButton } from 'react-native';
import { act, renderRouter, screen, fireEvent } from 'expo-router/testing-library';
import { dbOperations } from '@/database/operations';
import { getStoredUsername } from '@/services/syncService';
import { getTestDatabase } from '../../../test/expoSqliteNode';

// Presses the alert's button with this label, the way a user would.
async function pressAlertButton(label: string) {
  const buttons: AlertButton[] = jest.mocked(Alert.alert).mock.lastCall?.[2] ?? [];
  const button = buttons.find((b) => b.text === label);
  if (!button) throw new Error(`No alert button "${label}"`);
  await act(async () => {
    await button.onPress?.();
  });
}

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

// The database lives for the whole file, so the test that loads nothing runs first.
it('keeps onboarding open when the long-press is cancelled', async () => {
  await renderRouter('./app', { initialUrl: '/' });
  expect(await screen.findByText('Get Started')).toBeOnTheScreen();

  await fireEvent(screen.getByTestId('onboarding-wordmark'), 'longPress');
  await pressAlertButton('Cancel');

  expect(screen).toHavePathname('/onboarding');
  const counts = await dbOperations.getDatabaseCounts();
  expect(counts.totalSetlists).toBe(0);
});

it('loads the demo data from onboarding and opens the dashboard without a sync', async () => {
  // What a sync that failed half-way leaves: a real concert with a set whose id the demo
  // data also uses.
  getTestDatabase().exec(`
    INSERT INTO setlists (id, eventDate) VALUES ('real-1', '01-01-2020');
    INSERT INTO sets (id, setlistId, songOrder) VALUES (1, 'real-1', 0);
    INSERT INTO songs (setId, name, songOrder) VALUES (1, 'Real Song', 0);
  `);
  await renderRouter('./app', { initialUrl: '/' });
  expect(await screen.findByText('Get Started')).toBeOnTheScreen();

  await fireEvent(screen.getByTestId('onboarding-wordmark'), 'longPress');
  await pressAlertButton('Load demo data');

  expect(await screen.findByTestId('dashboard-screen')).toBeOnTheScreen();
  const counts = await dbOperations.getDatabaseCounts();
  expect(counts.totalSetlists).toBe(8);
  // Only the demo data is left, and the gate stays open on the next launch.
  const realSongs = getTestDatabase()
    .prepare("SELECT COUNT(*) AS n FROM songs WHERE name = 'Real Song'")
    .get();
  expect(realSongs).toEqual({ n: 0 });
  expect(await getStoredUsername()).toBe('e2e-seed');
});
