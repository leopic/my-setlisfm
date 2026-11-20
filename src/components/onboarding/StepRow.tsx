import { View, Text, Animated } from 'react-native';
import { useChronicleColors } from '@/utils/colors';
import { SPINE_PADDING_LEFT, STEP_DOT_TOP, type OnboardingStyles } from './styles';
import type { StepStatus } from './types';
import { Radius } from '@/utils/radius';

type StepDotProps = {
  status: StepStatus;
  glowAnim: Animated.Value;
  styles: OnboardingStyles;
};

// The dot on the spine, plus the pulsing halo behind it while the step is active.
function StepDot({ status, glowAnim, styles }: StepDotProps) {
  const colors = useChronicleColors();

  const isActive = status === 'active';
  const isDone = status === 'done';
  const isWaiting = status === 'waiting';
  const isError = status === 'error';

  const dotSize = isActive ? 22 : 13;
  const dotLeft = -(SPINE_PADDING_LEFT + dotSize / 2 + 1);
  const haloSize = 52;
  const haloLeft = dotLeft - (haloSize - dotSize) / 2;
  const haloTop = STEP_DOT_TOP - (haloSize - dotSize) / 2;
  const dotBg = isError ? colors.danger : isActive || isDone ? colors.dotActive : 'transparent';

  return (
    <>
      {isActive && (
        <Animated.View
          style={[
            styles.glowHalo,
            { width: haloSize, height: haloSize, left: haloLeft, top: haloTop, opacity: glowAnim },
          ]}
        />
      )}
      <View
        style={[
          styles.dotBase,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: Radius.full,
            left: dotLeft,
            backgroundColor: dotBg,
            borderWidth: isWaiting ? 1.5 : 0,
            borderColor: colors.dotInactive,
            opacity: isDone ? 0.55 : 1,
          },
        ]}
      />
    </>
  );
}

type StepRowProps = {
  status: StepStatus;
  title: string;
  detail?: string;
  progressPct?: number;
  isLast: boolean;
  fadeAnim: Animated.Value;
  glowAnim: Animated.Value;
  quipOpacity: Animated.Value;
  displayedQuip?: string;
  styles: OnboardingStyles;
};

function titleStyleFor(status: StepStatus, styles: OnboardingStyles) {
  if (status === 'waiting') return styles.stepTitleWaiting;
  if (status === 'done') return styles.stepTitleDone;
  if (status === 'error') return styles.stepTitleError;
  return undefined;
}

export default function StepRow({
  status,
  title,
  detail,
  progressPct,
  isLast,
  fadeAnim,
  glowAnim,
  quipOpacity,
  displayedQuip,
  styles,
}: StepRowProps) {
  const isActive = status === 'active';
  const isWaiting = status === 'waiting';

  return (
    <Animated.View
      style={[styles.stepEntry, isLast && styles.stepEntryLast, { opacity: fadeAnim }]}
    >
      <StepDot status={status} glowAnim={glowAnim} styles={styles} />
      <Text style={[styles.stepTitle, titleStyleFor(status, styles)]}>{title}</Text>
      {detail ? (
        <Text numberOfLines={1} style={[styles.stepDetail, isWaiting && styles.stepDetailWaiting]}>
          {detail}
        </Text>
      ) : null}
      <View style={[styles.progressBar, { opacity: progressPct !== undefined ? 1 : 0 }]}>
        <View style={[styles.progressFill, { width: `${progressPct ?? 0}%` }]} />
      </View>
      <View style={styles.quipContainer}>
        {isActive && displayedQuip ? (
          <Animated.Text style={[styles.quipText, { opacity: quipOpacity }]}>
            {displayedQuip}
          </Animated.Text>
        ) : null}
      </View>
    </Animated.View>
  );
}
