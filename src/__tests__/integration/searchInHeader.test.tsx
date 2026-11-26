import { Platform } from 'react-native';
import { searchInHeader } from '@/utils/searchInHeader';

// Only an iPhone has the native bar under a large title; the iPad and Android keep SearchInput.
it('puts the search field in the header only under a large title on iOS', () => {
  expect(searchInHeader(true)).toBe(true);
  expect(searchInHeader(false)).toBe(false);
  jest.replaceProperty(Platform, 'OS', 'android');
  expect(searchInHeader(true)).toBe(false);
});
