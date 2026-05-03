import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 768;
export const SIDEBAR_WIDTH = 360;

export function useTabletLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  return { isTablet, sidebarWidth: SIDEBAR_WIDTH };
}
