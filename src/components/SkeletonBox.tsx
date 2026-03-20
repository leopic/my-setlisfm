import { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';
import { useColors } from '../utils/colors';

interface Props {
  width: ViewStyle['width'];
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonBox({ width, height, borderRadius = 4, style }: Props) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          borderCurve: 'continuous',
          backgroundColor: colors.backgroundPill,
          opacity,
        },
        style,
      ]}
    />
  );
}
