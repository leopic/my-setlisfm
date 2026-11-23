import type * as ReactNative from 'react-native';
import type * as ExpoImage from 'expo-image';

// The root layout caps expo-image's memory cache when it loads. Only iOS has configureCache:
// on Android the call threw and the app crashed before its first screen.
it.each([
  ['ios', 1],
  ['android', 0],
] as const)('caps the image cache on %s only', (os, calls) => {
  let configureCache: jest.SpyInstance | undefined;
  jest.isolateModules(() => {
    const { Platform } = jest.requireActual<typeof ReactNative>('react-native');
    jest.replaceProperty(Platform, 'OS', os);
    const { Image } = jest.requireActual<typeof ExpoImage>('expo-image');
    configureCache = jest.spyOn(Image, 'configureCache').mockImplementation(() => {});
    jest.requireActual('../../../app/_layout');
  });
  expect(configureCache).toHaveBeenCalledTimes(calls);
  jest.restoreAllMocks();
});
