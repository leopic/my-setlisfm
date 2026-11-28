import { Platform } from 'react-native';

/**
 * On an iPhone the large title's bar holds the way into continents, countries and cities: one
 * globe button with a native menu (VenueToolbar), like the Dashboard's sync and settings. Android
 * has no native menu without '@expo/ui' (Stack.Toolbar throws there), and the iPad has no native
 * header, so both keep VenueGeoStrip in the list.
 */
export const geoMenuInHeader = (underLargeTitle: boolean) =>
  underLargeTitle && Platform.OS === 'ios';
