import { act, screen } from 'expo-router/testing-library';
import * as syncService from '@/services/syncService';
import { seedDatabase } from '../../../test/database';
import { launchApp } from '../../../test/screen';

beforeAll(seedDatabase);

afterEach(() => {
  jest.restoreAllMocks();
});

it('stops the pull-to-refresh spinner when the sync throws', async () => {
  await launchApp();
  const failure = new Error('disk full');
  jest.spyOn(syncService, 'setStoredUsername').mockRejectedValue(failure);
  // The dashboard's scroll view holds its RefreshControl element as a prop.
  const refreshControl = () => {
    const scrollView = screen.container.queryAll((n) => !!n.props.refreshControl)[0];
    if (!scrollView) throw new Error('No RefreshControl on the dashboard');
    return scrollView.props.refreshControl.props as {
      refreshing: boolean;
      onRefresh: () => Promise<void>;
    };
  };
  expect(refreshControl().refreshing).toBe(false);

  // The refresh handler rethrows the sync error; the test catches it.
  let thrown: unknown;
  await act(async () => {
    try {
      await refreshControl().onRefresh();
    } catch (error) {
      thrown = error;
    }
  });

  expect(thrown).toBe(failure);
  expect(syncService.setStoredUsername).toHaveBeenCalled();
  expect(refreshControl().refreshing).toBe(false);
});
