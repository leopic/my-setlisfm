import { Platform } from 'react-native';

/**
 * On an iPhone the large title's bar holds the year filter: one calendar button with a native
 * menu (ConcertsToolbar), like the Venues globe. Android has no native menu without '@expo/ui'
 * (Stack.Toolbar throws there), and the iPad has no native header, so both keep the year pill
 * and its sheet in the list.
 */
export const yearMenuInHeader = (underLargeTitle: boolean) =>
  underLargeTitle && Platform.OS === 'ios';
