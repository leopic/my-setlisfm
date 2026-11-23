import type { ComponentProps } from 'react';
import { Platform } from 'react-native';
import type { Stack } from 'expo-router';
import { useChronicleColors } from './colors';
import { Type } from './typography';

type ScreenOptions = Exclude<
  NonNullable<ComponentProps<typeof Stack.Screen>['options']>,
  (...args: never[]) => unknown
>;

/**
 * Header options for a tab's root screen: the iOS large title, which collapses into the bar
 * as the list scrolls (Settings, Mail). The bar is transparent, so iOS 26 draws its glass edge.
 * The screen's list needs contentInsetAdjustmentBehavior="automatic" to start below the title
 * and to tell the header how far it scrolled. Android gets a plain, solid bar (see below).
 */
export function useLargeTitleOptions(title: string): ScreenOptions {
  const colors = useChronicleColors();
  // Android has no large title, and contentInsetAdjustmentBehavior is iOS only: a transparent
  // bar there sat on top of the content. So Android gets a plain bar in the screen's color.
  if (Platform.OS !== 'ios') {
    return {
      headerShown: true,
      title,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: { fontFamily: Type.headline.fontFamily, color: colors.textPrimary },
    };
  }
  return {
    headerShown: true,
    title,
    headerLargeTitleEnabled: true,
    headerTransparent: true,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerLargeStyle: { backgroundColor: 'transparent' },
    headerLargeTitleStyle: { fontFamily: Type.largeTitle.fontFamily, color: colors.textPrimary },
    headerTitleStyle: { fontFamily: Type.headline.fontFamily, color: colors.textPrimary },
  };
}
