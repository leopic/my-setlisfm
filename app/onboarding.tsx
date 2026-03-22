import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { syncConcertData, setStoredUsername } from '../src/services/syncService';
import type { SyncProgress } from '../src/services/syncService';
import { useSyncContext } from '../src/contexts/SyncContext';
import { useColors } from '../src/utils/colors';

type Phase = 'input' | 'syncing' | 'done' | 'error';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { notifySyncComplete } = useSyncContext();

  const [username, setUsername] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 32,
        },
        title: {
          fontSize: 32,
          fontWeight: '700',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
        },
        subtitle: {
          fontSize: 17,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 48,
        },
        input: {
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          paddingHorizontal: 16,
          paddingVertical: 16,
          fontSize: 17,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          textAlign: 'center',
        },
        button: {
          backgroundColor: colors.primary,
          borderRadius: 12,
          borderCurve: 'continuous' as const,
          paddingVertical: 16,
          alignItems: 'center',
        },
        buttonDisabled: {
          opacity: 0.5,
        },
        buttonText: {
          color: colors.textInverse,
          fontSize: 17,
          fontWeight: '600',
        },
        progressContainer: {
          alignItems: 'center',
        },
        progressTitle: {
          fontSize: 20,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 24,
          textAlign: 'center',
        },
        progressDetail: {
          fontSize: 15,
          color: colors.textSecondary,
          marginTop: 16,
          textAlign: 'center',
        },
        progressCount: {
          fontSize: 15,
          color: colors.primary,
          fontWeight: '600',
          marginTop: 8,
          textAlign: 'center',
        },
        doneContainer: {
          alignItems: 'center',
        },
        doneTitle: {
          fontSize: 28,
          fontWeight: '700',
          color: colors.primary,
          marginBottom: 8,
          textAlign: 'center',
        },
        doneMessage: {
          fontSize: 17,
          color: colors.textSecondary,
          marginBottom: 40,
          textAlign: 'center',
        },
        errorText: {
          fontSize: 15,
          color: colors.danger,
          textAlign: 'center',
          marginBottom: 16,
        },
        progressBar: {
          width: '100%',
          height: 6,
          backgroundColor: colors.backgroundPill,
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 24,
        },
        progressBarFill: {
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: 3,
        },
      }),
    [colors],
  );

  const handleStart = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setPhase('syncing');
    await setStoredUsername(trimmed);

    const result = await syncConcertData(trimmed, (p) => {
      setProgress(p);
      if (p.newConcertsFound > 0) {
        setTotalFound(p.newConcertsFound);
      }
    });

    if (result.success) {
      setTotalFound(result.newConcerts);
      notifySyncComplete();
      setPhase('done');
    } else {
      setErrorMessage(result.error ?? t('onboarding.error'));
      setPhase('error');
    }
  };

  const handleRetry = () => {
    setPhase('input');
    setProgress(null);
    setTotalFound(0);
    setErrorMessage('');
  };

  const handleLetsGo = () => {
    router.replace('/(tabs)');
  };

  const progressPercent =
    progress && progress.totalPages > 0
      ? Math.round((progress.currentPage / progress.totalPages) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {phase === 'input' && (
          <View>
            <Text style={styles.title}>{t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
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

        {phase === 'syncing' && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>{t('onboarding.fetchingConcerts')}</Text>
            <ActivityIndicator size="large" color={colors.primary} />
            {progress && (
              <>
                <Text style={styles.progressDetail}>
                  {t('onboarding.fetchingPage', {
                    current: progress.currentPage,
                    total: progress.totalPages,
                  })}
                </Text>
                {progress.totalConcerts > 0 && (
                  <Text style={styles.progressCount}>
                    {t('onboarding.totalConcerts', { count: progress.totalConcerts })}
                  </Text>
                )}
                <View style={styles.progressBar}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
              </>
            )}
          </View>
        )}

        {phase === 'done' && (
          <View style={styles.doneContainer}>
            <Text style={styles.doneTitle}>{t('onboarding.syncComplete')}</Text>
            <Text style={styles.doneMessage}>
              {t('onboarding.syncCompleteMessage', { count: totalFound })}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleLetsGo}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.letsGo')}
            >
              <Text style={styles.buttonText}>{t('onboarding.letsGo')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.doneContainer}>
            <Text style={styles.progressTitle}>{t('onboarding.error')}</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleRetry}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.retry')}
            >
              <Text style={styles.buttonText}>{t('onboarding.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
