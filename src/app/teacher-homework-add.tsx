import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import {
  fetchSubjectsCatalog,
  fetchSyllabusApi,
  fetchTeacherStudents,
  getSavedSelectedClassId,
  saveHomework,
  saveSelectedClassId,
  updateHomework,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherHomeworkAddScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useTeacherAuth();
  const classes = profile?.classes ?? [];

  const {
    classId: paramClassId,
    sectionId: paramSectionId,
    date,
    homeworkId,
    initialSubject,
    initialChapter,
    initialDescription,
    existingPhotos,
  } = useLocalSearchParams<{
    classId?: string;
    sectionId?: string;
    date: string;
    homeworkId?: string;
    initialSubject?: string;
    initialChapter?: string;
    initialDescription?: string;
    existingPhotos?: string;
  }>();

  const isEditing = !!homeworkId;
  const existingPhotoUrls = existingPhotos ? existingPhotos.split('|').filter(Boolean) : [];

  const [selectedClassId, setSelectedClassId] = useState<string | null>(paramClassId ?? null);
  const [subject, setSubject] = useState(initialSubject ?? '');
  const [chapter, setChapter] = useState(initialChapter ?? '');
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [syllabusOptions, setSyllabusOptions] = useState<{ label: string; value: string }[]>([]);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<{ label: string; value: string }[]>([]);
  const [hasStudents, setHasStudents] = useState<boolean | null>(null);
  const [checkingStudents, setCheckingStudents] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedClassId) {
      getSavedSelectedClassId().then((saved) => {
        if (saved && classes.some((c) => String(c.class_id) === saved)) {
          setSelectedClassId(saved);
        } else if (classes.length > 0) {
          setSelectedClassId(String(classes[0].class_id));
        }
      });
    }
  }, [classes, selectedClassId]);

  const classOptions = classes.map((c) => ({
    label: `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`,
    value: String(c.class_id),
  }));

  const selectedClassObj = classes.find((c) => String(c.class_id) === selectedClassId);
  const currentSectionId = selectedClassObj?.section_id ? String(selectedClassObj.section_id) : (paramSectionId ?? '');

  useEffect(() => {
    if (!selectedClassId) {
      setHasStudents(null);
      return;
    }
    setCheckingStudents(true);
    fetchTeacherStudents(Number(selectedClassId), currentSectionId ? Number(currentSectionId) : undefined)
      .then((students) => {
        const activeList = Array.isArray(students)
          ? students.filter((s) => s.account_status !== 0 && (s as any).status !== 0)
          : [];
        setHasStudents(activeList.length > 0);
      })
      .catch(() => {
        setHasStudents(true);
      })
      .finally(() => {
        setCheckingStudents(false);
      });
  }, [selectedClassId, currentSectionId]);

  function handleClassChange(val: string | null) {
    setSelectedClassId(val);
    if (val) saveSelectedClassId(val);
    setSubject('');
    setChapter('');
    setIsCustomChapter(false);
    setSyllabusOptions([]);
  }

  function handleSubjectChange(val: string | null) {
    const newSubject = val ?? '';
    setSubject(newSubject);
    setChapter('');
    setIsCustomChapter(false);
    setSyllabusOptions([]);
  }

  useEffect(() => {
    if (!selectedClassId) return;
    fetchSubjectsCatalog(Number(selectedClassId))
      .then((subjects) => setSubjectOptions(subjects.map((s) => ({ label: s.name, value: s.name }))))
      .catch(() => setSubjectOptions([]));
  }, [selectedClassId]);

  // Fetch optional Syllabus Chapters when class and subject are selected
  useEffect(() => {
    if (!selectedClassObj || !subject) {
      setSyllabusOptions([]);
      return;
    }
    const classNameStr = `${selectedClassObj.class_name}${selectedClassObj.section_name ? ` - ${selectedClassObj.section_name}` : ''}`;
    fetchSyllabusApi(classNameStr, subject)
      .then((chapters) => {
        if (chapters && chapters.length > 0) {
          const options = [
            { label: '+ Add Custom Chapter / Unit', value: '__CUSTOM_CHAPTER__' },
            ...chapters.map((ch) => ({
              label: `Ch ${ch.chapter_number}: ${ch.chapter_title}`,
              value: `Ch ${ch.chapter_number}: ${ch.chapter_title}`,
            })),
          ];
          setSyllabusOptions(options);
        } else {
          setSyllabusOptions([]);
        }
      })
      .catch(() => setSyllabusOptions([]));
  }, [selectedClassObj, subject]);

  function handleSyllabusSelect(val: string | null) {
    if (val === '__CUSTOM_CHAPTER__') {
      setIsCustomChapter(true);
      setChapter('');
    } else {
      setChapter(val ?? '');
    }
  }

  async function addPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  function removePhoto(uri: string) {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }

  async function handleSave() {
    if (!subject.trim()) {
      setError('Please select or enter a subject.');
      return;
    }
    if (!selectedClassId) {
      setError('Please select a class.');
      return;
    }
    if (hasStudents === false) {
      Alert.alert('Cannot Add Homework', 'No students in this class have a registered device yet.', [
        { text: 'OK' },
      ]);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let warningMsg: string | undefined;
      if (isEditing) {
        await updateHomework({
          id: Number(homeworkId),
          subject: subject.trim(),
          chapter: chapter.trim() || undefined,
          description: description.trim(),
          photoUris: photos.length > 0 ? photos : undefined,
        });
      } else {
        const res = await saveHomework({
          classId: Number(selectedClassId),
          sectionId: currentSectionId ? Number(currentSectionId) : undefined,
          subject: subject.trim(),
          chapter: chapter.trim() || undefined,
          date,
          description: description.trim(),
          photoUris: photos,
        });
        warningMsg = res.notificationWarning;
      }

      if (warningMsg) {
        Alert.alert('Notice', warningMsg, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save homework.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary" style={styles.dateLabel}>
        For {date}
      </ThemedText>

      <Card>
        {/* Class Selection Dropdown */}
        {classes.length > 0 ? (
          <SelectField
            label="Class"
            placeholder="Select Class"
            value={selectedClassId}
            options={classOptions}
            onChange={handleClassChange}
          />
        ) : null}

        {hasStudents === false ? (
          <View style={styles.noStudentsCard}>
            <Ionicons name="alert-circle" size={20} color={Brand.red} style={styles.warningIcon} />
            <ThemedText type="smallBold" style={styles.noStudentsText}>
              No students in this class have a registered device yet. Adding homework is not allowed for this class.
            </ThemedText>
          </View>
        ) : null}

        {/* Subject Selection Dropdown / Text Field */}
        {subjectOptions.length > 0 ? (
          <SelectField
            label="Subject"
            placeholder="Select subject"
            value={subject || null}
            options={subjectOptions}
            onChange={handleSubjectChange}
            searchable
          />
        ) : (
          <>
            <ThemedText type="smallBold" style={styles.fieldLabel}>
              Subject
            </ThemedText>
            <TextInput
              value={subject}
              onChangeText={handleSubjectChange}
              placeholder="e.g. Mathematics"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
          </>
        )}

        {/* Single Combined Chapter / Syllabus Dropdown or Custom Input */}
        {syllabusOptions.length > 1 && !isCustomChapter ? (
          <SelectField
            label="Chapter / Unit (Optional)"
            placeholder="Select chapter"
            value={chapter || null}
            options={syllabusOptions}
            onChange={handleSyllabusSelect}
          />
        ) : (
          <>
            <View style={styles.chapterHeaderRow}>
              <ThemedText type="smallBold" style={styles.fieldLabelNoMargin}>
                Chapter / Unit (Optional)
              </ThemedText>
              {syllabusOptions.length > 1 ? (
                <Pressable
                  onPress={() => {
                    setIsCustomChapter(false);
                    setChapter('');
                  }}
                  hitSlop={8}
                  style={styles.redCloseBtn}
                >
                  <Ionicons name="close-circle" size={22} color={Brand.red} />
                </Pressable>
              ) : null}
            </View>
            <TextInput
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Chapter 1: Rational Numbers"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
          </>
        )}

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Details
        </ThemedText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What should students do?"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={5}
          style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
        />

        <ThemedText type="smallBold" style={styles.fieldLabel}>
          Photos
        </ThemedText>
        {existingPhotoUrls.length > 0 ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.existingLabel}>
              Already attached
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {existingPhotoUrls.map((uri) => (
                <Image key={uri} source={{ uri }} style={[styles.photoThumb, styles.existingThumbSpacing]} contentFit="cover" />
              ))}
            </ScrollView>
          </>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary" style={styles.existingLabel}>
          {isEditing ? 'Add more photos' : 'Add photos'}
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          {photos.map((uri) => (
            <View key={uri} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
              <Pressable onPress={() => removePhoto(uri)} style={styles.removePhoto}>
                <Ionicons name="close" size={14} color={Brand.white} />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={addPhoto} style={[styles.addPhotoBox, { borderColor: theme.border }]}>
            <Ionicons name="camera-outline" size={22} color={theme.textSecondary} />
          </Pressable>
        </ScrollView>

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={submitting || hasStudents === false || checkingStudents}
          style={[
            styles.button,
            {
              backgroundColor: theme.tint,
              opacity: submitting || hasStudents === false || checkingStudents ? 0.5 : 1,
            },
          ]}
        >
          <ThemedText type="smallBold" style={styles.buttonLabel}>
            {submitting
              ? 'Saving…'
              : checkingStudents
              ? 'Checking Class…'
              : isEditing
              ? 'Save Changes'
              : 'Save Homework'}
          </ThemedText>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateLabel: {
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
  },
  noStudentsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.two + 2,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  warningIcon: {
    marginRight: Spacing.two,
  },
  noStudentsText: {
    color: '#991B1B',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  fieldLabelNoMargin: {
    marginBottom: 0,
  },
  redCloseBtn: {
    padding: 2,
  },
  existingLabel: {
    marginBottom: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  existingThumbSpacing: {
    marginRight: Spacing.two,
  },
  photoWrap: {
    position: 'relative',
    marginRight: Spacing.two,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
  },
  removePhoto: {
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
  addPhotoBox: {
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
