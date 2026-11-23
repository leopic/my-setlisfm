import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
// Jest resolves the iOS files, so the Android variant is imported by its full name.
import DashboardToolbar from '@/components/dashboard/DashboardToolbar.android';

// On Android Stack.Toolbar throws without '@expo/ui', so the dashboard puts the JS buttons
// in the header instead. Without them a phone on Android could not sync or open settings.
it('puts sync and settings in the header on Android', async () => {
  const onSync = jest.fn();
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Chronicles' }} />
        <DashboardToolbar onSync={onSync} />
      </>
    ),
    '(home)/settings': () => null,
  });
  await fireEvent.press(await screen.findByLabelText('Sync concert data'));
  expect(onSync).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Open settings')).toBeTruthy();
});
