import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { sendTeacherNotification } from '@/data/teacher-api';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

interface SendNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  classId: number;
  sectionId?: number;
  /** null = whole class, otherwise a specific student's roster ref + name. */
  target: { ref: string; name: string } | null;
}

/** Compose sheet for an ad-hoc push alert — opened either from a single
 * student's row (target set) or the Students tab header ("Notify Class",
 * target null). Same modal either way, just a different recipient line. */
export function SendNotificationModal({ visible, onClose, classId, sectionId, target }: SendNotificationModalProps) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle('');
    setBody('');
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setError('Please fill in both a title and a message.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await sendTeacherNotification({
        classId,
        sectionId,
        studentRef: target?.ref,
        title: title.trim(),
        body: body.trim(),
      });
      Alert.alert('Sent', `Notification delivered to ${result.sentTo} device${result.sentTo === 1 ? '' : 's'}.`);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send notification.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.dark ? 'rgba(59, 130, 246, 0.22)' : theme.backgroundSelected }]}>
              <Ionicons name="notifications" size={18} color={theme.dark ? '#60A5FA' : theme.tint} />
            </View>
            <View style={styles.headerText}>
              <ThemedText type="smallBold">Send Alert</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {target ? `To ${target.name}` : 'To the whole class'}
              </ThemedText>
            </View>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Title
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Reminder"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />

          <ThemedText type="smallBold" style={styles.fieldLabel}>
            Message
          </ThemedText>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write your message…"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
          />

          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={[styles.sendButton, { backgroundColor: theme.tint, opacity: sending ? 0.6 : 1 }]}
          >
            <Ionicons name="send" size={16} color={Brand.white} />
            <ThemedText type="smallBold" style={styles.sendButtonLabel}>
              {sending ? 'Sending…' : 'Send'}
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.three,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
  },
  sendButtonLabel: {
    color: Brand.white,
  },
});
