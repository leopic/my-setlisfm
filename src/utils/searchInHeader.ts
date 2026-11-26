import { Platform } from 'react-native';

/**
 * On an iPhone the search field sits in the native bar under the large title (Stack.SearchBar):
 * it hides as the list scrolls and has the system Cancel button. The iPad has no native header
 * on these lists, and Android has no large title, so both keep SearchInput above the list.
 */
export const searchInHeader = (underLargeTitle: boolean) =>
  underLargeTitle && Platform.OS === 'ios';
