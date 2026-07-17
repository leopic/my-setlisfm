import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { Icon } from '@/components/ui';
import { answerQuestion, resumeWithChoice } from '@/services/chat/parser';
import type { ChatContext, ClarificationNeeded } from '@/services/chat/types';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  clarification?: ClarificationNeeded;
  clarificationAnswered?: boolean;
}

export default function AskScreen() {
  const colors = useChronicleColors();
  const router = useRouter();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const chatContext = useRef<ChatContext>({});

  const examples = t('chat.examples', { returnObjects: true }) as string[];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    backButton: { padding: 4 },
    headerTitle: { ...Type.heading, color: colors.textPrimary, flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 10, flexGrow: 1 },
    bubbleRow: { flexDirection: 'row' },
    bubbleRowUser: { justifyContent: 'flex-end' },
    bubbleRowAssistant: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '85%',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleUser: { backgroundColor: colors.accent },
    bubbleAssistant: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleTextUser: { ...Type.body, color: colors.textOnAccent },
    bubbleTextAssistant: { ...Type.body, color: colors.textPrimary },
    clarificationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    optionChip: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    optionChipText: { ...Type.label, color: colors.accent },
    examplesWrap: { padding: 16, gap: 10 },
    examplesLabel: { ...Type.label, color: colors.textMuted, letterSpacing: 0.5 },
    exampleChip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 8,
    },
    exampleChipText: { ...Type.body, color: colors.textSecondary },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: { backgroundColor: colors.border },
  });

  const appendMessage = (message: Omit<ChatMessage, 'id'>) => {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { id, ...message }]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    return id;
  };

  const submitQuestion = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    appendMessage({ role: 'user', text: trimmed });
    setInput('');
    setThinking(true);
    try {
      const result = await answerQuestion(trimmed, chatContext.current);
      if (result.type === 'clarification') {
        appendMessage({ role: 'assistant', text: result.prompt, clarification: result });
      } else {
        if (result.type === 'answer' && result.context) chatContext.current = result.context;
        appendMessage({ role: 'assistant', text: result.text });
      }
    } finally {
      setThinking(false);
    }
  };

  const handleClarificationChoice = async (
    message: ChatMessage,
    optionLabel: string,
    optionValue: string,
  ) => {
    if (!message.clarification || message.clarificationAnswered) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, clarificationAnswered: true } : m)),
    );
    appendMessage({ role: 'user', text: optionLabel });
    setThinking(true);
    try {
      const result = await resumeWithChoice(
        message.clarification.resume,
        optionValue,
        chatContext.current,
      );
      if (result.type === 'answer' && result.context) chatContext.current = result.context;
      appendMessage({
        role: 'assistant',
        text: result.type === 'clarification' ? result.prompt : result.text,
        clarification: result.type === 'clarification' ? result : undefined,
      });
    } finally {
      setThinking(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="ask-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon sf="chevron.left" md="chevron-back-outline" size={20} color={colors.accent} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('chat.title')}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.examplesWrap}>
              <Text style={styles.examplesLabel}>{t('chat.examplesLabel').toUpperCase()}</Text>
              {examples.map((example) => (
                <Pressable
                  key={example}
                  style={({ pressed }) => [styles.exampleChip, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => submitQuestion(example)}
                  accessibilityRole="button"
                >
                  <Text style={styles.exampleChipText}>{example}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.bubbleRow,
                  message.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAssistant,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                  ]}
                >
                  <Text
                    style={
                      message.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant
                    }
                  >
                    {message.text}
                  </Text>
                  {message.clarification && !message.clarificationAnswered && (
                    <View style={styles.clarificationOptions}>
                      {message.clarification.options.map((option) => (
                        <Pressable
                          key={option.value}
                          style={({ pressed }) => [
                            styles.optionChip,
                            { opacity: pressed ? 0.7 : 1 },
                          ]}
                          onPress={() =>
                            handleClarificationChoice(message, option.label, option.value)
                          }
                          accessibilityRole="button"
                        >
                          <Text style={styles.optionChipText}>{option.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!thinking}
            onSubmitEditing={() => submitQuestion(input)}
          />
          <Pressable
            style={[styles.sendButton, (thinking || !input.trim()) && styles.sendButtonDisabled]}
            onPress={() => submitQuestion(input)}
            disabled={thinking || !input.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('chat.send')}
          >
            <Icon sf="arrow.up" md="arrow-up-outline" size={18} color={colors.textOnAccent} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
