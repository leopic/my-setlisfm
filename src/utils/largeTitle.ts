import type { ComponentProps } from 'react';
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
 * and to tell the header how far it scrolled.
 */
export function useLargeTitleOptions(title: string): ScreenOptions {
  const colors = useChronicleColors();
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
