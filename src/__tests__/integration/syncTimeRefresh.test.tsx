import { act, render, renderHook, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import SyncSection from '@/components/settings/SyncSection';
import { useSettingsStyles } from '@/components/settings/useSettingsStyles';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 21, 15, 0) });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function renderSyncRow(lastSyncedAt: Date) {
  const { result } = await renderHook(() => useSettingsStyles());
  await render(
    <SyncSection
      styles={result.current}
      lastSyncedAt={lastSyncedAt}
      isSyncing={false}
      hasUsername
      onSync={() => {}}
    />,
  );
}

it('moves on from "Just now" while the screen stays open', async () => {
  await renderSyncRow(new Date());
  expect(screen.getByText('Just now')).toBeOnTheScreen();

  await act(async () => {
    jest.advanceTimersByTime(5 * 60 * 1000);
  });

  expect(screen.getByText('5 minutes ago')).toBeOnTheScreen();
});

it('catches up as soon as the app comes back to the front', async () => {
  const listeners: ((state: AppStateStatus) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    listeners.push(listener);
    return { remove: jest.fn() };
  });
  await renderSyncRow(new Date());

  // Half an hour in the background, where no timer fires.
  jest.setSystemTime(new Date(2026, 10, 21, 15, 30, 30));
  await act(async () => {
    listeners.forEach((listener) => listener('active'));
  });

  expect(screen.getByText('30 minutes ago')).toBeOnTheScreen();
});
