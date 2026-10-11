// The first render in each file loads the whole app/ tree, which takes
// 20–30s on CI with a cold transform cache. (testTimeout can't be set per
// Jest project, hence a setup file.)
jest.setTimeout(60000);
