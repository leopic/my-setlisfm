import { Observe } from 'expo-observe';

// EAS Observe: startup and per-screen performance metrics plus JS errors, shown in the
// Observe tab of the Expo dashboard. See https://docs.expo.dev/eas/observe/introduction/
//
// configure() must run once before any screen mounts: useObserve() asserts the Expo Router
// integration doesn't change during a screen's lifecycle. The root layout imports this
// module for its side effect, so it runs when the layout module loads.
//
// Debug builds don't send metrics by default. Set EXPO_PUBLIC_OBSERVE_DISPATCH_IN_DEBUG=true
// in .env to send them from a dev build, e.g. to check the setup on the simulator.
//
// EXPO_PUBLIC_OBSERVE_ENVIRONMENT tags every event, so the dashboard can tell builds apart
// (e.g. `e2e` for CI runs). Unset or empty, Observe uses NODE_ENV: `production` in a release
// build.
export const observeConfig = {
  integrations: { 'expo-router': true },
  dispatchInDebug: process.env.EXPO_PUBLIC_OBSERVE_DISPATCH_IN_DEBUG === 'true',
  environment: process.env.EXPO_PUBLIC_OBSERVE_ENVIRONMENT || undefined,
} as const;

Observe.configure(observeConfig);
