import { useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import Icon from './Icon';
import { useTranslation } from 'react-i18next';

interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
}

export default function SearchInput({ value, onChangeText, style, ...rest }: SearchInputProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const inputRef = useRef<TextInputInstance>(null);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
    },
    input: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      padding: 0,
      minHeight: TOUCH_TARGET,
    },
    clearButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      // The icon stays where the padding put it; the target reaches into the padding.
      marginRight: -14,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Icon
        sf="magnifyingglass"
        md="search-outline"
        size={15}
        color={colors.textMuted}
        style={{ marginRight: 6 }}
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
      {value.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => {
            onChangeText('');
            inputRef.current?.focus();
          }}
          accessibilityLabel={t('common.clearSearch')}
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}
