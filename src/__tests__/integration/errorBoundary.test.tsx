import { Text } from 'react-native';
import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import AppMetrics from 'expo-app-metrics';
import { Observe } from 'expo-observe';
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
  const dispatchEvents = jest.mocked(Observe.dispatchEvents);

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
  // ...and sends it right away, after it is recorded.
  expect(dispatchEvents).toHaveBeenCalledTimes(1);
  expect(dispatchEvents.mock.invocationCallOrder[0]).toBeGreaterThan(
    reportError.mock.invocationCallOrder[0],
  );

  shouldThrow = false;
  await fireEvent.press(screen.getByRole('button', { name: 'Try Again' }));
  expect(await screen.findByText('Recovered')).toBeOnTheScreen();
});

it('keeps the error screen when sending the error fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const offline = new Error('offline');
  jest.mocked(Observe.dispatchEvents).mockRejectedValueOnce(offline);

  await renderRouter({
    _layout: { default: () => <Slot />, ErrorBoundary },
    index: () => {
      throw new Error('Database is locked');
    },
  });

  expect(await screen.findByText('Something went wrong')).toBeOnTheScreen();
  await waitFor(() => expect(warn).toHaveBeenCalledWith('Observe dispatch failed:', offline));
});
