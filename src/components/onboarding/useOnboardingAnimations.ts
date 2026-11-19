import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import type { StepStatus } from './types';

// Pulsing glow for whichever dot is currently active
export function useGlowPulse() {
  const [glowAnim] = useState(() => new Animated.Value(0.35));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.25, duration: 1300, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);
  return glowAnim;
}

// Quip fade animation — same as before
export function useQuipFade(incoming: string | undefined) {
  const [quipOpacity] = useState(() => new Animated.Value(0));
  const [displayedQuip, setDisplayedQuip] = useState<string | undefined>(undefined);
  const latestQuipRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!incoming || incoming === latestQuipRef.current) return;
    latestQuipRef.current = incoming;
    Animated.timing(quipOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setDisplayedQuip(incoming);
      Animated.timing(quipOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  }, [incoming, quipOpacity]);

  const resetQuip = () => {
    latestQuipRef.current = undefined;
    setDisplayedQuip(undefined);
  };
  return { quipOpacity, displayedQuip, resetQuip };
}

// Per-step crossfade — Animated.Values and display states.
// Crossfade: when a step's real status changes, fade out → swap display → fade in.
// With `delayMs`, the fade waits that long first (step 2 wakes up after step 1 has settled).
export function useStepCrossfade(status: StepStatus, delayMs?: number) {
  const [fade] = useState(() => new Animated.Value(1));
  const [display, setDisplay] = useState<StepStatus>('waiting');
  useEffect(() => {
    if (status === display) return;
    const fadeOutSwapFadeIn = () => {
      Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setDisplay(status);
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    };
    if (delayMs === undefined) {
      fadeOutSwapFadeIn();
      return;
    }
    const timer = setTimeout(fadeOutSwapFadeIn, delayMs);
    return () => clearTimeout(timer);
  }, [status, display, fade, delayMs]);
  return { display, fade };
}
