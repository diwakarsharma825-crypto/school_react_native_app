import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import { addTeacherNotice, updateTeacherNotice, formatClassLabel } from '@/data/teacher-api';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherAddNoticeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useTeacherAuth();
  const params = useLocalSearchParams<{ id?: string; initialTitle?: string; initialBody?: string }>();
  const isEditing = !!params.id;

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: formatClassLabel(c.class_name, c.section_name),
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(classOptions[0]?.value ?? null);
  const [title, setTitle] = useState(params.initialTitle ?? '');
  const [body, setBody] = useState(params.initialBody ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!isEditing && !classId) {
      setError('Please choose a class.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError('Please fill in both title and notice.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEditing) {
        await updateTeacherNotice(Number(params.id), title.trim(), body.trim());
      } else {
        const selected = classes.find((c) => String(c.class_id) === classId);
        await addTeacherNotice({
          title: title.trim(),
          body: body.trim(),
          classId: Number(classId),
          sectionId: selected?.section_id ?? undefined,
        });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish notice.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TeacherGuard>
    <Screen>
      <Card style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
          {isEditing
            ? 'Changes save immediately and are visible to students right away.'
            : 'This notice publishes immediately to students in the selected class and sends them a push notification.'}
        </ThemedText>

        {isEditing ? null : (
          <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={setClassId} />
        )}

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Title
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Notice title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Notice
        </ThemedText>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write the notice…"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={5}
          style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
        />

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.button, { backgroundColor: theme.tint, opacity: submitting ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.buttonLabel}>
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Publish Notice'}
          </ThemedText>
        </Pressable>
      </Card>
    </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  intro: {
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  error: {
    color: Brand.red,
    marginTop: Spacing.three,
  },
  button: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.four,
  },
  buttonLabel: {
    color: Brand.white,
  },
});
