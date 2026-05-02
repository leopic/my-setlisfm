import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { syncConcertData, setStoredUsername } from '@/services/syncService';
import type { SyncProgress } from '@/services/syncService';
import { useSyncContext } from '@/contexts/SyncContext';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';

type Phase = 'input' | 'syncing' | 'done' | 'error';
type StepStatus = 'waiting' | 'active' | 'done' | 'error';

// Spine geometry constants
const SPINE_MARGIN_LEFT = 24;
const SPINE_PADDING_LEFT = 28;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useChronicleColors();
  const { notifySyncComplete } = useSyncContext();

  const [username, setUsername] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Pulsing glow for whichever dot is currently active
  const glowAnim = useRef(new Animated.Value(0.35)).current;
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

  // Per-step crossfade — Animated.Values and display states.
  // The useEffects that drive these are placed after step status derivations
  // (they reference step1Status/step2Status which are declared later).
  const step1Fade = useRef(new Animated.Value(1)).current;
  const step2Fade = useRef(new Animated.Value(1)).current;
  const [step1Display, setStep1Display] = useState<StepStatus>('waiting');
  const [step2Display, setStep2Display] = useState<StepStatus>('waiting');

  // Quip fade animation — same as before
  const quipOpacity = useRef(new Animated.Value(0)).current;
  const [displayedQuip, setDisplayedQuip] = useState<string | undefined>(undefined);
  const latestQuipRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const incoming = progress?.quip;
    if (!incoming || incoming === latestQuipRef.current) return;
    latestQuipRef.current = incoming;
    Animated.timing(quipOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setDisplayedQuip(incoming);
      Animated.timing(quipOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  }, [progress?.quip, quipOpacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          paddingTop: 28,
          paddingBottom: 8,
          alignItems: 'center',
        },
        wordmark: {
          ...Type.label,
          color: colors.accent,
          letterSpacing: 4,
        },

        // ── Spine area ───────────────────────────────────────────────────
        spineArea: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 36,
        },
        spineTrack: {
          borderLeftWidth: 1.5,
          borderLeftColor: colors.spineColor,
          marginLeft: SPINE_MARGIN_LEFT,
          paddingLeft: SPINE_PADDING_LEFT,
        },

        // ── Step entry ───────────────────────────────────────────────────
        stepEntry: {
          paddingTop: 2,
          paddingBottom: 40,
          position: 'relative',
        },
        stepEntryLast: {
          paddingBottom: 8,
        },

        // Dot (base — position/size set inline)
        dotBase: {
          position: 'absolute',
          top: 6,
        },

        // Glow halo behind active dot (size/position set inline)
        glowHalo: {
          position: 'absolute',
          borderRadius: 25,
          backgroundColor: colors.accent,
        },

        // Step text
        stepTitle: {
          ...Type.title,
          color: colors.textPrimary,
          marginBottom: 3,
        },
        stepTitleWaiting: {
          color: colors.textDisabled,
          fontWeight: '400',
        },
        stepTitleDone: {
          color: colors.textMuted,
        },
        stepTitleError: {
          color: colors.danger,
        },
        stepDetail: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 1,
        },
        stepDetailWaiting: {
          color: colors.textDisabled,
        },

        // Progress bar
        progressBar: {
          width: '100%',
          height: 2,
          backgroundColor: colors.border,
          borderRadius: 1,
          overflow: 'hidden',
          marginTop: 10,
        },
        progressFill: {
          height: '100%',
          backgroundColor: colors.accent,
          borderRadius: 1,
        },

        // Quip — fixed-height container prevents layout shift between
        // 0, 1, and 2-line quips. Height = 2 lines × lineHeight 20 + buffer.
        quipContainer: {
          marginTop: 12,
          height: 44,
          overflow: 'hidden',
          justifyContent: 'flex-start',
        },
        quipText: {
          ...Type.body,
          color: colors.textMuted,
          fontStyle: 'italic',
          lineHeight: 20,
        },

        // ── Bottom section ───────────────────────────────────────────────
        bottom: {
          paddingHorizontal: 36,
          paddingBottom: 36,
          paddingTop: 8,
        },
        input: {
          ...Type.body,
          color: colors.textPrimary,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: 14,
          textAlign: 'center',
        },
        button: {
          backgroundColor: colors.accent,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
        },
        buttonDisabled: { opacity: 0.35 },
        buttonText: {
          ...Type.title,
          color: colors.textOnAccent,
        },
        doneTitle: {
          ...Type.heading,
          color: colors.textPrimary,
          marginBottom: 4,
        },
        doneMessage: {
          ...Type.body,
          color: colors.textSecondary,
          marginBottom: 24,
        },
        errorButton: {
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
        },
        errorButtonText: {
          ...Type.title,
          color: colors.danger,
        },
      }),
    [colors],
  );

  // ── Step status derivation ─────────────────────────────────────────────────
  const step1Status: StepStatus =
    phase === 'input'
      ? 'waiting'
      : phase === 'error'
        ? 'error'
        : phase === 'done'
          ? 'done'
          : progress?.phase === 'fetching'
            ? 'active'
            : 'done';

  const step2Status: StepStatus =
    phase === 'input' || phase === 'error'
      ? 'waiting'
      : phase === 'done'
        ? 'done'
        : progress?.phase === 'images'
          ? 'active'
          : progress?.phase === 'done'
            ? 'done'
            : 'waiting';

  // Crossfade: when a step's real status changes, fade out → swap display → fade in.
  // step2 waits 320 ms so it wakes up after step1 has settled.
  useEffect(() => {
    if (step1Status === step1Display) return;
    Animated.timing(step1Fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setStep1Display(step1Status);
      Animated.timing(step1Fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }, [step1Status]); // intentionally omits step1Display/step1Fade — they're stable refs/state setters

  useEffect(() => {
    if (step2Status === step2Display) return;
    const timer = setTimeout(() => {
      Animated.timing(step2Fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setStep2Display(step2Status);
        Animated.timing(step2Fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 320);
    return () => clearTimeout(timer);
  }, [step2Status]); // intentionally omits step2Display/step2Fade — they're stable refs/state setters

  // Content derived from DISPLAY states so the crossfade carries the right text.
  // Live progress values (page numbers, counts) still read from `progress` directly
  // since those only matter when the display status is 'active' anyway.

  // Step 1: Concerts
  const step1Title =
    step1Display === 'waiting'
      ? 'Your concerts'
      : step1Display === 'error'
        ? 'Something went wrong'
        : step1Display === 'done'
          ? `${progress?.totalConcerts ?? totalFound} concerts`
          : 'Finding concerts…';

  const step1Detail =
    step1Display === 'waiting'
      ? 'Synced from setlist.fm'
      : step1Display === 'active' && progress
        ? `Page ${progress.currentPage} of ${progress.totalPages}${progress.totalConcerts > 0 ? `  ·  ${progress.totalConcerts} total` : ''}`
        : step1Display === 'done'
          ? 'All saved ✓'
          : step1Display === 'error'
            ? errorMessage
            : undefined;

  const step1Progress =
    step1Display === 'active' && progress && progress.totalPages > 0
      ? Math.round((progress.currentPage / progress.totalPages) * 100)
      : undefined;

  // Step 2: Photos
  const step2Title =
    step2Display === 'waiting'
      ? 'Artist photos'
      : step2Display === 'active'
        ? 'Fetching photos…'
        : 'Photos ready';

  const step2Detail =
    step2Display === 'waiting'
      ? "A face for every act you've seen"
      : step2Display === 'active' && progress?.imagesTotal
        ? `${progress.imagesDone ?? 0} of ${progress.imagesTotal} artists`
        : step2Display === 'done'
          ? 'All matched ✓'
          : undefined;

  const step2Progress =
    step2Display === 'active' && progress?.imagesTotal
      ? Math.round(((progress.imagesDone ?? 0) / progress.imagesTotal) * 100)
      : undefined;

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
      setTimeout(() => router.replace('/(tabs)/(home)'), 1200);
    } else {
      const msg =
        result.error === 'User not found' ? t('onboarding.userNotFound') : t('onboarding.error');
      setErrorMessage(msg);
      setPhase('error');
    }
  };

  const handleRetry = () => {
    setPhase('input');
    setProgress(null);
    setTotalFound(0);
    setErrorMessage('');
    latestQuipRef.current = undefined;
    setDisplayedQuip(undefined);
  };

  // ── Spine step renderer ───────────────────────────────────────────────────
  const renderStep = (
    status: StepStatus,
    title: string,
    detail: string | undefined,
    progressPct: number | undefined,
    showQuip: boolean,
    isLast: boolean,
    fadeAnim: Animated.Value,
  ) => {
    const isActive = status === 'active';
    const isDone = status === 'done';
    const isWaiting = status === 'waiting';
    const isError = status === 'error';

    // Dot geometry — active dot is bigger to anchor the glow
    const dotSize = isActive ? 22 : 13;
    const dotLeft = -(SPINE_PADDING_LEFT + dotSize / 2 + 1);

    // Glow halo geometry — centred on the dot
    const haloSize = 52;
    const haloLeft = dotLeft - (haloSize - dotSize) / 2;
    const haloTop = 6 - (haloSize - dotSize) / 2;

    const dotBg = isError
      ? colors.danger
      : isActive
        ? colors.dotActive
        : isDone
          ? colors.dotActive
          : 'transparent';

    return (
      <Animated.View
        style={[styles.stepEntry, isLast && styles.stepEntryLast, { opacity: fadeAnim }]}
      >
        {/* Glow halo (active only) */}
        {isActive && (
          <Animated.View
            style={[
              styles.glowHalo,
              {
                width: haloSize,
                height: haloSize,
                left: haloLeft,
                top: haloTop,
                opacity: glowAnim,
              },
            ]}
          />
        )}

        {/* Dot */}
        <View
          style={[
            styles.dotBase,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              left: dotLeft,
              backgroundColor: dotBg,
              borderWidth: isWaiting ? 1.5 : 0,
              borderColor: colors.dotInactive,
              opacity: isDone ? 0.55 : 1,
            },
          ]}
        />

        {/* Text content */}
        <Text
          style={[
            styles.stepTitle,
            isWaiting && styles.stepTitleWaiting,
            isDone && styles.stepTitleDone,
            isError && styles.stepTitleError,
          ]}
        >
          {title}
        </Text>

        {detail ? (
          <Text
            numberOfLines={1}
            style={[styles.stepDetail, isWaiting && styles.stepDetailWaiting]}
          >
            {detail}
          </Text>
        ) : null}

        {/* Progress bar — always rendered so height never shifts */}
        <View style={[styles.progressBar, { opacity: progressPct !== undefined ? 1 : 0 }]}>
          <View style={[styles.progressFill, { width: `${progressPct ?? 0}%` }]} />
        </View>

        {/* Quip container — fixed height to absorb 0 / 1 / 2-line variance */}
        <View style={styles.quipContainer}>
          {showQuip && displayedQuip ? (
            <Animated.Text style={[styles.quipText, { opacity: quipOpacity }]}>
              {displayedQuip}
            </Animated.Text>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.outer} edges={['top', 'left', 'right', 'bottom']}>
      {/* Wordmark */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>CHRONICLES</Text>
      </View>

      {/* Spine */}
      <View style={styles.spineArea}>
        <View style={styles.spineTrack}>
          {renderStep(
            step1Display,
            step1Title,
            step1Detail,
            step1Progress,
            step1Display === 'active',
            false,
            step1Fade,
          )}
          {renderStep(
            step2Display,
            step2Title,
            step2Detail,
            step2Progress,
            step2Display === 'active',
            true,
            step2Fade,
          )}
        </View>
      </View>

      {/* Bottom: input / done / error / empty during sync */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottom}
      >
        {phase === 'input' && (
          <View>
            <TextInput
              style={styles.input}
              placeholder={t('onboarding.usernamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleStart}
              accessibilityLabel={t('onboarding.usernamePlaceholder')}
            />
            <TouchableOpacity
              style={[styles.button, !username.trim() && styles.buttonDisabled]}
              onPress={handleStart}
              disabled={!username.trim()}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.getStarted')}
            >
              <Text style={styles.buttonText}>{t('onboarding.getStarted')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'error' && (
          <TouchableOpacity
            style={styles.errorButton}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.retry')}
          >
            <Text style={styles.errorButtonText}>{t('onboarding.retry')}</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
