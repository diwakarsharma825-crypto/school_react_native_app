import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  addTeacherEvent,
  deleteTeacherEventMedia,
  TeacherEventMediaItem,
  updateTeacherEvent,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

interface ExistingMedia {
  id: number;
  type: 'image' | 'video';
  url: string;
}

export default function TeacherEventAddScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useTeacherAuth();
  const params = useLocalSearchParams<{
    id?: string;
    initialTitle?: string;
    initialPlace?: string;
    initialFrom?: string;
    initialTo?: string;
    initialNote?: string;
    existingMedia?: string;
  }>();
  const isEditing = !!params.id;

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(classOptions[0]?.value ?? null);
  const [title, setTitle] = useState(params.initialTitle ?? '');
  const [eventPlace, setEventPlace] = useState(params.initialPlace ?? '');
  const [eventFrom, setEventFrom] = useState(params.initialFrom ?? '');
  const [eventTo, setEventTo] = useState(params.initialTo ?? '');
  const [note, setNote] = useState(params.initialNote ?? '');
  const [media, setMedia] = useState<TeacherEventMediaItem[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(() => {
    if (!params.existingMedia) return [];
    try {
      return JSON.parse(params.existingMedia);
    } catch {
      return [];
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function removeExistingMedia(item: ExistingMedia) {
    Alert.alert('Remove this file?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deleteTeacherEventMedia(item.id)
            .then(() => setExistingMedia((prev) => prev.filter((m) => m.id !== item.id)))
            .catch((e) => Alert.alert('Could not remove', e instanceof Error ? e.message : 'Please try again.'));
        },
      },
    ]);
  }

  async function addMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      const picked: TeacherEventMediaItem[] = result.assets.map((a) => ({
        uri: a.uri,
        type: a.type === 'video' ? 'video' : 'image',
        fileName: a.fileName,
        mimeType: a.mimeType,
      }));
      setMedia((prev) => [...prev, ...picked]);
    }
  }

  function removeMedia(uri: string) {
    setMedia((prev) => prev.filter((m) => m.uri !== uri));
  }

  async function handleSubmit() {
    if (!isEditing && !classId) {
      setError('Please choose a class.');
      return;
    }
    if (!title.trim() || !eventFrom.trim() || !eventTo.trim()) {
      setError('Title, start date and end date are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = isEditing
        ? await updateTeacherEvent({
            id: Number(params.id),
            title: title.trim(),
            eventPlace: eventPlace.trim(),
            eventFrom: eventFrom.trim(),
            eventTo: eventTo.trim(),
            note: note.trim(),
            media,
          })
        : await addTeacherEvent({
            classId: Number(classId),
            sectionId: classes.find((c) => String(c.class_id) === classId)?.section_id ?? undefined,
            title: title.trim(),
            eventPlace: eventPlace.trim(),
            eventFrom: eventFrom.trim(),
            eventTo: eventTo.trim(),
            note: note.trim(),
            media,
          });
      if (result.skipped.length > 0) {
        Alert.alert(
          'Event saved',
          `Saved, but ${result.skipped.length === 1 ? 'one file' : `${result.skipped.length} files`} could not be uploaded:\n\n` +
            result.skipped.map((s) => `• ${s.name ? s.name + ': ' : ''}${s.reason}`).join('\n'),
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        router.back();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save event.');
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
            ? 'Changes save immediately and are visible right away.'
            : 'This event publishes immediately to the app for students in the selected class and sends them a push notification.'}
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
          placeholder="Event title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Place
        </ThemedText>
        <TextInput
          value={eventPlace}
          onChangeText={setEventPlace}
          placeholder="e.g. School Auditorium"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <DatePickerField
              label="Start Date"
              placeholder="Select date"
              value={eventFrom || null}
              onChange={(d) => {
                setEventFrom(d);
                if (eventTo && eventTo < d) setEventTo(d);
              }}
            />
          </View>
          <View style={styles.dateField}>
            <DatePickerField
              label="End Date"
              placeholder="Select date"
              value={eventTo || null}
              onChange={setEventTo}
              minDate={eventFrom || undefined}
            />
          </View>
        </View>

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Details
        </ThemedText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What's this event about?"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Photos &amp; Videos
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
          {existingMedia.map((m) => (
            <View key={`existing-${m.id}`} style={styles.mediaWrap}>
              <Image source={{ uri: m.url }} style={styles.mediaThumb} contentFit="cover" />
              {m.type === 'video' ? (
                <View style={styles.videoBadge}>
                  <Ionicons name="videocam" size={14} color={Brand.white} />
                </View>
              ) : null}
              <Pressable onPress={() => removeExistingMedia(m)} style={styles.removeMedia}>
                <Ionicons name="close" size={14} color={Brand.white} />
              </Pressable>
            </View>
          ))}
          {media.map((m) => (
            <View key={m.uri} style={styles.mediaWrap}>
              <Image source={{ uri: m.uri }} style={styles.mediaThumb} contentFit="cover" />
              {m.type === 'video' ? (
                <View style={styles.videoBadge}>
                  <Ionicons name="videocam" size={14} color={Brand.white} />
                </View>
              ) : null}
              <Pressable onPress={() => removeMedia(m.uri)} style={styles.removeMedia}>
                <Ionicons name="close" size={14} color={Brand.white} />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={addMedia} style={[styles.addMediaBox, { borderColor: theme.border }]}>
            <Ionicons name="camera-outline" size={22} color={theme.textSecondary} />
          </Pressable>
        </ScrollView>

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
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Publish Event'}
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
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dateField: {
    flex: 1,
  },
  mediaRow: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  mediaWrap: {
    position: 'relative',
    marginRight: Spacing.two,
  },
  mediaThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 3,
    padding: 2,
  },
  removeMedia: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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
