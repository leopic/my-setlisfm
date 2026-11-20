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
import { useChronicleColors } from '@/utils/colors';
import { Radius } from '@/utils/radius';

interface Props {
  width: ViewStyle['width'];
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Text placeholders are capsules by default.
export default function SkeletonBox({ width, height, borderRadius = Radius.full, style }: Props) {
  const colors = useChronicleColors();
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
          // The smooth curve is for rounded boxes; capsules and circles stay round.
          borderCurve: borderRadius === Radius.full ? 'circular' : 'continuous',
          backgroundColor: colors.textDisabled,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
