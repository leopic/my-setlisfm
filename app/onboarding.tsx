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
import { useChronicleColors } from '../src/utils/colors';
import { Type } from '../src/utils/typography';

type Phase = 'input' | 'syncing' | 'done' | 'error';

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
        appName: {
          ...Type.label,
          color: colors.accent,
          textAlign: 'center',
          letterSpacing: 2,
          marginBottom: 12,
        },
        title: {
          ...Type.display,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
        },
        subtitle: {
          ...Type.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 40,
          lineHeight: 20,
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
          marginBottom: 16,
          textAlign: 'center',
        },
        button: {
          backgroundColor: colors.accent,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          alignSelf: 'stretch',
        },
        buttonDisabled: {
          opacity: 0.4,
        },
        buttonText: {
          ...Type.title,
          color: '#fff',
        },
        progressContainer: {
          alignItems: 'center',
        },
        progressTitle: {
          ...Type.heading,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 24,
        },
        progressDetail: {
          ...Type.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 16,
        },
        progressCount: {
          ...Type.title,
          color: colors.accent,
          textAlign: 'center',
          marginTop: 8,
        },
        doneContainer: {
          alignItems: 'center',
        },
        doneTitle: {
          ...Type.display,
          color: colors.accent,
          textAlign: 'center',
          marginBottom: 8,
        },
        doneMessage: {
          ...Type.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 40,
        },
        errorTitle: {
          ...Type.heading,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
        },
        errorText: {
          ...Type.body,
          color: '#ff6b6b',
          textAlign: 'center',
          marginBottom: 16,
        },
        errorButton: {
          backgroundColor: 'rgba(255,107,107,0.15)',
          borderWidth: 1,
          borderColor: '#ff6b6b',
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
        },
        errorButtonText: {
          ...Type.title,
          color: '#ff6b6b',
        },
        progressBar: {
          width: '100%',
          height: 3,
          backgroundColor: colors.border,
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: 24,
        },
        progressBarFill: {
          height: '100%',
          backgroundColor: colors.accent,
          borderRadius: 2,
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
    router.replace('/(tabs)/(home)');
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
            <Text style={styles.appName}>Chronicles</Text>
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
            <ActivityIndicator size="large" color={colors.accent} />
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
            <Text style={styles.errorTitle}>{t('onboarding.error')}</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={handleRetry}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.retry')}
            >
              <Text style={styles.errorButtonText}>{t('onboarding.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
