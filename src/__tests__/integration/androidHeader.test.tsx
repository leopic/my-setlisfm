import { Platform } from 'react-native';
import { seedDatabase } from '../../../test/database';
import { chronicleLight } from '@/utils/colors';
import { findNativeHeader, findScreen, launchApp, openTab } from '../../../test/screen';

beforeAll(seedDatabase);
afterEach(() => jest.restoreAllMocks());

// iOS draws the large title over the list, which starts below it through its content inset.
// Android has neither, so a transparent bar there covered the first rows: it gets a solid one.
it.each([
  ['ios', { largeTitle: true, translucent: true }],
  // Solid, in the screen's color (the tests run in light mode).
  [
    'android',
    { largeTitle: undefined, translucent: false, backgroundColor: chronicleLight.background },
  ],
] as const)('gives the tab headers the right bar on %s', async (os, bar) => {
  jest.replaceProperty(Platform, 'OS', os);
  await launchApp();
  expect(findNativeHeader('Chronicles')?.props).toMatchObject(bar);
  await openTab('(artists)');
  await findScreen('artists-screen');
  expect(findNativeHeader('Artists')?.props).toMatchObject(bar);
});
