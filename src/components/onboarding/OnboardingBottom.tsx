import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import type { OnboardingStyles } from './styles';
import type { Phase } from './types';

type OnboardingBottomProps = {
  phase: Phase;
  username: string;
  onChangeUsername: (value: string) => void;
  onStart: () => void;
  onRetry: () => void;
  styles: OnboardingStyles;
};

// Bottom section: username input + button, retry after an error, empty during sync/done.
export default function OnboardingBottom({
  phase,
  username,
  onChangeUsername,
  onStart,
  onRetry,
  styles,
}: OnboardingBottomProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();

  return (
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
            onChangeText={onChangeUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={onStart}
            accessibilityLabel={t('onboarding.usernamePlaceholder')}
          />
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !username.trim() && styles.buttonDisabled,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onStart}
            disabled={!username.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.getStarted')}
          >
            <Text style={styles.buttonText}>{t('onboarding.getStarted')}</Text>
          </Pressable>
        </View>
      )}

      {phase === 'error' && (
        <Pressable
          style={({ pressed }) => [styles.errorButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.retry')}
        >
          <Text style={styles.errorButtonText}>{t('onboarding.retry')}</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}
