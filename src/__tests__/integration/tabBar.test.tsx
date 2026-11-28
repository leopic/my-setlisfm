import { screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { launchApp } from '../../../test/screen';

beforeAll(seedDatabase);

// Like the Music app: on iOS 26 the tab bar shrinks to the open tab while a list scrolls down.
// A tap on it, or the top of the list, brings it back. The tab bar itself is native, so only
// its props show under Jest.
it('shrinks the tab bar while a list scrolls down', async () => {
  await launchApp();
  const [tabs] = screen.root?.queryAll((node) => node.type === 'RNSTabsHostIOS') ?? [];
  expect(tabs?.props.tabBarMinimizeBehavior).toBe('onScrollDown');
});
