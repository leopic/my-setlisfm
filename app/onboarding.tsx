import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { syncConcertData, setStoredUsername } from '@/services/syncService';
import type { SyncProgress } from '@/services/syncService';
import { useSyncContext } from '@/contexts/SyncContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { dbOperations } from '@/database/operations';
import { useChronicleColors } from '@/utils/colors';
import StepRow from '@/components/onboarding/StepRow';
import OnboardingBottom from '@/components/onboarding/OnboardingBottom';
import { createOnboardingStyles } from '@/components/onboarding/styles';
import {
  useGlowPulse,
  useQuipFade,
  useStepCrossfade,
} from '@/components/onboarding/useOnboardingAnimations';
import {
  concertsStepStatus,
  concertsStepContent,
  photosStepStatus,
  photosStepContent,
} from '@/components/onboarding/stepContent';
import type { Phase } from '@/components/onboarding/types';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const { notifySyncComplete } = useSyncContext();
  const { completeOnboarding } = useOnboardingContext();

  const [username, setUsername] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const glowAnim = useGlowPulse();
  const { quipOpacity, displayedQuip, resetQuip } = useQuipFade(progress?.quip);

  const styles = createOnboardingStyles(colors);

  // step2 waits 320 ms so it wakes up after step1 has settled.
  const { display: step1Display, fade: step1Fade } = useStepCrossfade(
    concertsStepStatus(phase, progress),
  );
  const { display: step2Display, fade: step2Fade } = useStepCrossfade(
    photosStepStatus(phase, progress),
    320,
  );

  const step1 = concertsStepContent(step1Display, t, progress, totalFound, errorMessage);
  const step2 = photosStepContent(step2Display, t, progress);

  // ── Handlers (unchanged) ──────────────────────────────────────────────────
  const handleStart = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setPhase('syncing');
    const result = await syncConcertData(trimmed, (p) => {
      setProgress(p);
      if (p.newConcertsFound > 0) setTotalFound(p.newConcertsFound);
    });
    if (result.success) {
      await setStoredUsername(trimmed);
      setTotalFound(result.newConcerts);
      notifySyncComplete();
      setPhase('done');
      // Both dots are now lit — give the user a moment to see them, then go.
      setTimeout(completeOnboarding, 1200);
    } else {
      const msg =
        result.error === 'User not found' ? t('onboarding.userNotFound') : t('onboarding.error');
      setErrorMessage(msg);
      setPhase('error');
    }
  };

  // Hidden on purpose (long-press on the wordmark): for demos on a fresh simulator,
  // where a setlist.fm sync is slow and depends on the network.
  const handleLoadDemoData = () => {
    Alert.alert(t('onboarding.demoDataTitle'), t('onboarding.demoDataMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('onboarding.demoDataLoad'),
        onPress: async () => {
          try {
            await dbOperations.loadDemoData();
          } catch {
            Alert.alert(t('onboarding.demoDataError'));
            return;
          }
          notifySyncComplete();
          completeOnboarding();
        },
      },
    ]);
  };

  const handleRetry = () => {
    setPhase('input');
    setProgress(null);
    setTotalFound(0);
    setErrorMessage('');
    resetQuip();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.outer} edges={['top', 'left', 'right', 'bottom']}>
      {/* Wordmark */}
      <View style={styles.header}>
        <Pressable
          onLongPress={handleLoadDemoData}
          disabled={phase !== 'input'}
          testID="onboarding-wordmark"
        >
          {/* eslint-disable-next-line i18next/no-literal-string -- app wordmark, not copy */}
          <Text style={styles.wordmark}>CHRONICLES</Text>
        </Pressable>
      </View>

      {/* Spine */}
      <View style={styles.spineArea}>
        <View style={styles.spineTrack}>
          <StepRow
            status={step1Display}
            title={step1.title}
            detail={step1.detail}
            progressPct={step1.progressPct}
            isLast={false}
            fadeAnim={step1Fade}
            glowAnim={glowAnim}
            quipOpacity={quipOpacity}
            displayedQuip={displayedQuip}
            styles={styles}
          />
          <StepRow
            status={step2Display}
            title={step2.title}
            detail={step2.detail}
            progressPct={step2.progressPct}
            isLast
            fadeAnim={step2Fade}
            glowAnim={glowAnim}
            quipOpacity={quipOpacity}
            displayedQuip={displayedQuip}
            styles={styles}
          />
        </View>
      </View>

      {/* Bottom: input / done / error / empty during sync */}
      <OnboardingBottom
        phase={phase}
        username={username}
        onChangeUsername={setUsername}
        onStart={handleStart}
        onRetry={handleRetry}
        styles={styles}
      />
    </SafeAreaView>
  );
}
