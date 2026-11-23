import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { findNativeHeader } from '../../../test/screen';
// Jest resolves the iOS files, so the Android variant is imported by its full name.
import DashboardToolbar from '@/components/dashboard/DashboardToolbar.android';

// On Android Stack.Toolbar throws without '@expo/ui', so the dashboard puts the JS buttons
// in the header instead. Without them a phone on Android could not sync or open settings.
it('puts sync and settings in the header on Android', async () => {
  const onSync = jest.fn();
  await renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <View testID="dashboard-body">
        <Stack.Screen options={{ headerShown: true, title: 'Chronicles' }} />
        <DashboardToolbar onSync={onSync} />
      </View>
    ),
    '(home)/settings': () => <Text>settings route</Text>,
  });

  await fireEvent.press(await screen.findByLabelText('Sync concert data'));
  expect(onSync).toHaveBeenCalledTimes(1);
  // In the header, not drawn over the content, and the title set beside it survives.
  expect(
    within(screen.getByTestId('dashboard-body')).queryByLabelText('Sync concert data'),
  ).toBeNull();
  expect(findNativeHeader('Chronicles')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Open settings'));
  expect(await screen.findByText('settings route')).toBeTruthy();
});
