import { Platform } from 'react-native';

/**
 * On an iPhone a list's order is picked from a Sort By menu in the native bar (headerSortMenu),
 * like the Music app, so no pills sit under the search field. Android has no native menu without
 * '@expo/ui' (Stack.Toolbar throws there), and the iPad has no native header on these lists, so
 * both keep the sort pills.
 */
export const sortMenuInHeader = (underLargeTitle: boolean) =>
  underLargeTitle && Platform.OS === 'ios';
