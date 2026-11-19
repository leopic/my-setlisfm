import { View, Text, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Icon } from '@/components/ui';
import type { SettingsStyles } from './useSettingsStyles';

type AccountSectionProps = {
  styles: SettingsStyles;
  username: string;
  editingUsername: string;
  isEditing: boolean;
  onChangeEditingUsername: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
};

export default function AccountSection({
  styles,
  username,
  editingUsername,
  isEditing,
  onChangeEditingUsername,
  onStartEdit,
  onSave,
  onCancelEdit,
}: AccountSectionProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('settings.account')}</Text>

      <View style={[styles.row, styles.rowFirst]}>
        <Text style={styles.rowLabel}>{t('settings.username')}</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.usernameInput}
              value={editingUsername}
              onChangeText={onChangeEditingUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onSave}
              placeholderTextColor={colors.textMuted}
            />
            <Pressable
              style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.7 : 1 }]}
              onPress={onSave}
            >
              <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.7 : 1 }]}
              onPress={onCancelEdit}
              accessibilityRole="button"
            >
              <Icon sf="xmark" md="close-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.rowValue}>{username || '—'}</Text>
            <Pressable
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              onPress={onStartEdit}
              accessibilityRole="button"
            >
              <Text style={styles.rowAction}>{t('settings.change')}</Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}
