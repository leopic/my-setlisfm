import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  cancelAnimation,
} from 'react-native-reanimated';
import { useColors } from '@/utils/colors';

interface Props {
  width: ViewStyle['width'];
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonBox({ width, height, borderRadius = 4, style }: Props) {
  const colors = useColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.set(
      withRepeat(
        withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.3, { duration: 800 })),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          borderCurve: 'continuous',
          backgroundColor: colors.backgroundPill,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
