import { Alert, type AlertButton } from 'react-native';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { dbOperations } from '@/database/operations';
import { DEMO_CONCERTS } from '@/demo/demoConcerts';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp } from '../../../test/screen';

// Presses the alert's button with this label, the way a user would.
async function pressAlertButton(label: string) {
  const buttons: AlertButton[] = jest.mocked(Alert.alert).mock.lastCall?.[2] ?? [];
  const button = buttons.find((b) => b.text === label);
  if (!button) throw new Error(`No alert button "${label}"`);
  await act(async () => {
    await button.onPress?.();
  });
}

const count = (sql: string) => (getTestDatabase().prepare(sql).get() as { n: number }).n;

async function openDemoScreen() {
  await launchApp();
  await fireEvent.press(await screen.findByLabelText('Open settings'));
  await fireEvent(await screen.findByTestId('settings-version'), 'longPress');
  return findScreen('demo-screen');
}

beforeAll(async () => {
  await seedDatabase();
  // node:sqlite enforces foreign keys by default; the app's expo-sqlite connection does
  // not. Demo 3's guest is missing from artists on purpose, so match the app.
  getTestDatabase().exec('PRAGMA foreign_keys = OFF');
  // A real Portuguese venue, with a country name the demo does not use: adding a demo
  // concert must not rename the country, and removing the demo concerts must keep it.
  getTestDatabase().exec(`
    INSERT INTO countries (code, name) VALUES ('PT', 'Portuguese Republic');
    INSERT INTO cities (id, name, countryCode) VALUES ('real-porto', 'Porto', 'PT');
    INSERT INTO venues (id, name, cityId) VALUES ('real-venue', 'Coliseu', 'real-porto');
  `);
});

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

// The database lives for the whole file, so the tests run in order: add, then remove.
it('adds a demo concert from the hidden Demo screen', async () => {
  const demo = await openDemoScreen();

  await fireEvent.press(demo.getByTestId('demo-add-1'));

  await waitFor(() => expect(demo.getByTestId('demo-add-1')).toBeDisabled());
  expect(demo.getByTestId('demo-add-1')).toHaveTextContent('Added');
  expect(demo.getByTestId('demo-add-2')).toBeEnabled();
  expect(await dbOperations.getAddedDemoConcerts()).toEqual([1]);
  expect(count('SELECT COUNT(*) AS n FROM songs WHERE tape = 2')).toBe(1);
});

it('adds a demo concert once when Add is tapped twice quickly', async () => {
  const demo = await openDemoScreen();
  // Hold the first add open, so the second tap lands while it runs.
  let finishFirstAdd = () => {};
  const realAdd = dbOperations.addDemoConcert.bind(dbOperations);
  const addDemoConcert = jest
    .spyOn(dbOperations, 'addDemoConcert')
    .mockImplementationOnce(async (number) => {
      await new Promise<void>((resolve) => (finishFirstAdd = resolve));
      await realAdd(number);
    });

  await fireEvent.press(demo.getByTestId('demo-add-2'));
  await fireEvent.press(demo.getByTestId('demo-add-2'));
  await act(async () => finishFirstAdd());

  await waitFor(() => expect(demo.getByTestId('demo-add-2')).toHaveTextContent('Added'));
  expect(addDemoConcert).toHaveBeenCalledTimes(1);
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(await dbOperations.getAddedDemoConcerts()).toEqual([1, 2]);
  addDemoConcert.mockRestore();
});

it('adds every demo concert, and adding one again changes nothing', async () => {
  for (const concert of DEMO_CONCERTS) {
    await dbOperations.addDemoConcert(concert.number);
  }
  await dbOperations.addDemoConcert(1);

  expect((await dbOperations.getAddedDemoConcerts()).sort((a, b) => a - b)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ]);
  expect(count("SELECT COUNT(*) AS n FROM setlists WHERE id LIKE 'demo-%'")).toBe(10);
  expect(count("SELECT COUNT(*) AS n FROM sets WHERE setlistId LIKE 'demo-%'")).toBe(10);
  expect(
    count(
      "SELECT COUNT(*) AS n FROM songs WHERE setId IN (SELECT id FROM sets WHERE setlistId = 'demo-1')",
    ),
  ).toBe(3);
});

it('keeps the demo concerts when the remove alert is cancelled', async () => {
  const demo = await openDemoScreen();

  await fireEvent.press(demo.getByTestId('demo-remove'));
  await pressAlertButton('Cancel');

  expect(count("SELECT COUNT(*) AS n FROM setlists WHERE id LIKE 'demo-%'")).toBe(10);
});

it('removes every demo concert and keeps the real data', async () => {
  const demo = await openDemoScreen();

  await fireEvent.press(demo.getByTestId('demo-remove'));
  await pressAlertButton('Remove');

  await waitFor(() => expect(demo.getByTestId('demo-add-1')).toBeEnabled());
  expect(count("SELECT COUNT(*) AS n FROM sets WHERE setlistId LIKE 'demo-%'")).toBe(0);
  // Songs of the removed sets: the seed's songs all belong to a set that still exists.
  expect(count('SELECT COUNT(*) AS n FROM songs WHERE setId NOT IN (SELECT id FROM sets)')).toBe(0);
  for (const table of ['setlists', 'venues', 'cities']) {
    expect(count(`SELECT COUNT(*) AS n FROM ${table} WHERE id LIKE 'demo-%'`)).toBe(0);
  }
  expect(count("SELECT COUNT(*) AS n FROM artists WHERE mbid LIKE 'demo-%'")).toBe(0);
  expect(count("SELECT COUNT(*) AS n FROM countries WHERE code IN ('IS', 'XKX')")).toBe(0);
  // The seed's 8 concerts, and the country a real city still uses.
  expect(count('SELECT COUNT(*) AS n FROM setlists')).toBe(8);
  expect(getTestDatabase().prepare("SELECT name FROM countries WHERE code = 'PT'").get()).toEqual({
    name: 'Portuguese Republic',
  });
});

it('enables the buttons again when the reload after a change fails', async () => {
  const demo = await openDemoScreen();
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  // The first load already ran; make the reload after the change fail once.
  const reload = jest
    .spyOn(dbOperations, 'getAddedDemoConcerts')
    .mockRejectedValueOnce(new Error('reload failed'));

  await fireEvent.press(demo.getByTestId('demo-add-1'));

  await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(demo.getByTestId('demo-add-1')).toBeEnabled());
  expect(demo.getByTestId('demo-add-2')).toBeEnabled();
  // The failure is logged, not thrown out of the press handler.
  expect(consoleError).toHaveBeenCalledWith('Demo concert refresh failed:', expect.any(Error));
  consoleError.mockRestore();
  reload.mockRestore();
});
