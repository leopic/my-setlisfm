import { Alert } from 'react-native';
import { renderRouter, screen, fireEvent } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';

beforeAll(seedDatabase);

it('returns to onboarding after clearing everything from settings', async () => {
  // Confirm the destructive alert as soon as it opens.
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.style === 'destructive')?.onPress?.();
  });

  renderRouter('./app', { initialUrl: '/' });

  fireEvent.press(await screen.findByLabelText('Open settings'));
  fireEvent.press(await screen.findByLabelText('Clear all data'));

  expect(await screen.findByText('Get Started')).toBeOnTheScreen();
  expect(screen).toHavePathname('/onboarding');
});
