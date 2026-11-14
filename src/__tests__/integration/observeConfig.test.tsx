import type { observeConfig } from '@/services/observe';

// The config module reads the environment when it loads, so load a fresh copy per case.
function loadConfigWith(environment: string | undefined): typeof observeConfig {
  if (environment === undefined) delete process.env.EXPO_PUBLIC_OBSERVE_ENVIRONMENT;
  else process.env.EXPO_PUBLIC_OBSERVE_ENVIRONMENT = environment;
  let config: typeof observeConfig | undefined;
  jest.isolateModules(() => {
    ({ observeConfig: config } = jest.requireActual<{ observeConfig: typeof observeConfig }>(
      '@/services/observe',
    ));
  });
  if (!config) throw new Error('observeConfig did not load');
  return config;
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_OBSERVE_ENVIRONMENT;
});

it('tags Observe events with the environment from EXPO_PUBLIC_OBSERVE_ENVIRONMENT', () => {
  expect(loadConfigWith('e2e').environment).toBe('e2e');
});

it("leaves the environment to Observe's default when unset or empty", () => {
  expect(loadConfigWith(undefined).environment).toBeUndefined();
  expect(loadConfigWith('').environment).toBeUndefined();
});
