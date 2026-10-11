import { renderRouter, screen, fireEvent } from 'expo-router/testing-library';

// Onboarding's sync would hit setlist.fm; stand in a successful one. Storing
// the username stays real, since that is what the gate keys on.
jest.mock('@/services/syncService', () => ({
  ...jest.requireActual('@/services/syncService'),
  syncConcertData: jest
    .fn()
    .mockResolvedValue({ success: true, pagesProcessed: 1, newConcerts: 0 }),
}));

it('opens onboarding on first launch and the dashboard once sync completes', async () => {
  await renderRouter('./app', { initialUrl: '/' });

  expect(await screen.findByText('Get Started')).toBeOnTheScreen();
  expect(screen).toHavePathname('/onboarding');

  await fireEvent.changeText(screen.getByPlaceholderText('Your setlist.fm username'), 'leopic');
  await fireEvent.press(screen.getByText('Get Started'));

  // Onboarding holds the finished state for a moment before handing off.
  expect(await screen.findByTestId('dashboard-screen', {}, { timeout: 3000 })).toBeOnTheScreen();
});
