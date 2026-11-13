import { Text } from 'react-native';
import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import AppMetrics from 'expo-app-metrics';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Expo Router renders a layout's exported ErrorBoundary with `error` and `retry` and no
// children, so the fallback has to come from those props.
let shouldThrow = true;

function Flaky() {
  if (shouldThrow) throw new Error('Database is locked');
  return <Text>Recovered</Text>;
}

it('shows the error from a route and recovers on retry', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const reportError = jest.spyOn(AppMetrics, 'reportError');

  await renderRouter({
    _layout: { default: () => <Slot />, ErrorBoundary },
    index: Flaky,
  });

  expect(await screen.findByText('Something went wrong')).toBeOnTheScreen();
  expect(screen.getByText('Database is locked')).toBeOnTheScreen();
  // Render errors skip the global handler, so the boundary reports them to EAS Observe.
  expect(reportError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Database is locked', isFatal: false }),
  );

  shouldThrow = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Try Again' }));
  expect(await screen.findByText('Recovered')).toBeOnTheScreen();
});
