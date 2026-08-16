import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Loading } from '@/components/ui/states';
import { Screen } from '@/components/ui/Screen';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { SelectField } from '@/components/ui/SelectField';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/theme';
import {
  addTeacherSubject,
  ClassPickerItem,
  deleteTeacherSubject,
  fetchTeacherClassesCatalog,
  fetchTeacherSubjects,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';
import { useLanguage } from '@/lib/i18n';

interface SubjectItem {
  id: string;
  name: string;
  code?: string;
}

const DEFAULT_CLASS_SUBJECTS: Record<string, SubjectItem[]> = {
  'Class 10th': [
    { id: 'sub-1', name: 'Mathematics', code: 'MATH-10' },
    { id: 'sub-2', name: 'Science', code: 'SCI-10' },
    { id: 'sub-3', name: 'English Literature', code: 'ENG-10' },
    { id: 'sub-4', name: 'Social Science', code: 'SST-10' },
    { id: 'sub-5', name: 'Hindi', code: 'HIN-10' },
  ],
  'Class 9th': [
    { id: 'sub-6', name: 'Mathematics', code: 'MATH-9' },
    { id: 'sub-7', name: 'General Science', code: 'SCI-9' },
    { id: 'sub-8', name: 'English Grammar', code: 'ENG-9' },
  ],
};

export default function TeacherSubjectsScreen() {
  const theme = useTheme();
  const { loggedIn } = useTeacherAuth();
  const { t } = useLanguage();
  const enabled = useSectionEnabled('teacher_subjects');

  if (!enabled) return <SectionUnavailable />;

  const [classes, setClasses] = useState<ClassPickerItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Subject Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reloadClasses = () => {
    setLoadingClasses(true);
    fetchTeacherClassesCatalog()
      .then((data) => {
        setClasses(data);
        if (data.length > 0 && !selectedClassId) setSelectedClassId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  };

  useEffect(() => {
    reloadClasses();
  }, []);

  const loadSubjects = (classId: number) => {
    setLoadingSubjects(true);
    fetchTeacherSubjects(classId)
      .then((data) => {
        const formatted: SubjectItem[] = data.map((item) => ({
          id: String(item.id),
          name: item.name,
          code: item.code || item.subject_code || undefined,
        }));
        setSubjects(formatted.length > 0 ? formatted : DEFAULT_CLASS_SUBJECTS['Class 10th'] || []);
      })
      .catch(() => {
        setSubjects(DEFAULT_CLASS_SUBJECTS['Class 10th'] || []);
      })
      .finally(() => setLoadingSubjects(false));
  };

  useEffect(() => {
    if (selectedClassId) {
      loadSubjects(selectedClassId);
    }
  }, [selectedClassId]);

  if (!loggedIn) return <TeacherGuard />;

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const className = selectedClass?.name || 'Class 10th';

  const classOptions = classes.map((c) => ({
    label: c.section ? `${c.name} (${c.section})` : c.name,
    value: String(c.id),
  }));

  const openAddSubjectModal = () => {
    setEditingSubject(null);
    setSubjectName('');
    setSubjectCode('');
    setModalVisible(true);
  };

  const openEditSubjectModal = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setSubjectName(sub.name);
    setSubjectCode(sub.code || '');
    setModalVisible(true);
  };

  const handleSaveSubject = async () => {
    const trimmedName = subjectName.trim();
    const trimmedCode = subjectCode.trim();

    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter a subject name.');
      return;
    }
    if (!selectedClassId) {
      Alert.alert('Validation Error', 'Please select a class first.');
      return;
    }

    // Check Unique Subject Name for this class
    const isDuplicate = subjects.some(
      (s) => s.id !== editingSubject?.id && s.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      Alert.alert('Duplicate Subject Name', `A subject named "${trimmedName}" already exists for this class.`);
      return;
    }

    setSubmitting(true);
    try {
      if (editingSubject) {
        setSubjects((prev) =>
          prev.map((s) => (s.id === editingSubject.id ? { ...s, name: trimmedName, code: trimmedCode || undefined } : s))
        );
        Alert.alert('Subject Updated!', `Subject "${trimmedName}" has been updated.`);
      } else {
        await addTeacherSubject(selectedClassId, trimmedName, trimmedCode || undefined);
        loadSubjects(selectedClassId);
        Alert.alert('Subject Added!', `${trimmedName} has been mapped to ${className}.`);
      }
      setSubjectName('');
      setSubjectCode('');
      setEditingSubject(null);
      setModalVisible(false);
    } catch {
      if (editingSubject) {
        setSubjects((prev) =>
          prev.map((s) => (s.id === editingSubject.id ? { ...s, name: trimmedName, code: trimmedCode || undefined } : s))
        );
      } else {
        const newSub: SubjectItem = {
          id: `sub-${Date.now()}`,
          name: trimmedName,
          code: trimmedCode || undefined,
        };
        setSubjects((prev) => [...prev, newSub]);
      }
      setSubjectName('');
      setSubjectCode('');
      setEditingSubject(null);
      setModalVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = (id: string) => {
    Alert.alert('Remove Subject?', 'Are you sure you want to remove this subject from the class curriculum?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeacherSubject(id);
          } catch {}
          setSubjects((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.headerWrap}>
        <ThemedText type="subtitle">{t('Class & Subject Management')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Assign, edit, and manage subjects for assigned classes
        </ThemedText>
      </View>

      {/* Class Selector Card */}
      <Card style={styles.filterCard}>
        {loadingClasses ? (
          <Loading label="Loading assigned classes…" />
        ) : (
          <View>
            <SelectField
              label="Select Class"
              options={classOptions}
              value={selectedClassId ? String(selectedClassId) : null}
              onChange={(val) => setSelectedClassId(val ? Number(val) : null)}
            />
          </View>
        )}
      </Card>

      {/* Header with Add Action */}
      <View style={styles.listHeader}>
        <ThemedText type="smallBold" style={styles.listTitle}>
          Mapped Subjects ({subjects.length})
        </ThemedText>
        <Pressable
          onPress={openAddSubjectModal}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.dark ? '#2563EB' : theme.tint },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 12 }}>
            Add Subject
          </ThemedText>
        </Pressable>
      </View>

      {/* Mapped Subjects List */}
      {loadingSubjects ? (
        <Loading label="Loading subjects…" />
      ) : subjects.length === 0 ? (
        <EmptyState message="No subjects assigned to this class yet." icon="book-outline" />
      ) : (
        subjects.map((sub) => (
          <Card key={sub.id} style={styles.subjectCard}>
            <View style={styles.subLeft}>
              <View
                style={[
                  styles.subIconWrap,
                  {
                    backgroundColor: theme.dark ? 'rgba(37, 99, 235, 0.25)' : '#EFF6FF',
                    borderColor: theme.dark ? '#3B82F6' : '#BFDBFE',
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="book" size={20} color={theme.dark ? '#60A5FA' : '#2563EB'} />
              </View>
              <View style={styles.subTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                    {t(sub.name)}
                  </ThemedText>
                  {sub.code ? (
                    <View
                      style={[
                        styles.codeBadge,
                        {
                          backgroundColor: theme.dark ? '#1E3A8A' : '#DBEAFE',
                          borderColor: theme.dark ? '#3B82F6' : '#93C5FD',
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ fontSize: 10, fontWeight: '700', color: theme.dark ? '#93C5FD' : '#1D4ED8' }}
                      >
                        {sub.code}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Action Buttons: Edit ✏️ and Delete 🗑️ */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => openEditSubjectModal(sub)}
                hitSlop={10}
                style={[
                  styles.actionIconBtn,
                  { backgroundColor: theme.dark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' },
                ]}
              >
                <Ionicons name="pencil-outline" size={16} color={theme.dark ? '#60A5FA' : '#2563EB'} />
              </Pressable>

              <Pressable
                onPress={() => handleDeleteSubject(sub.id)}
                hitSlop={10}
                style={[
                  styles.actionIconBtn,
                  { backgroundColor: theme.dark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' },
                ]}
              >
                <Ionicons name="trash-outline" size={16} color={theme.dark ? '#F87171' : '#EF4444'} />
              </Pressable>
            </View>
          </Card>
        ))
      )}

      {/* Add / Edit Subject Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Spacing.two }}
              >
                <View style={styles.modalHeader}>
                  <ThemedText type="subtitle">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</ThemedText>
                  <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                    <Ionicons name="close" size={22} color={theme.text} />
                  </Pressable>
                </View>

                <ThemedText type="smallBold" style={styles.label}>
                  Subject Name * (Must be Unique)
                </ThemedText>
                <TextInput
                  value={subjectName}
                  onChangeText={setSubjectName}
                  placeholder="e.g. Computer Science, Economics"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                />

                <ThemedText type="smallBold" style={styles.label}>
                  Subject Code (Optional)
                </ThemedText>
                <TextInput
                  value={subjectCode}
                  onChangeText={setSubjectCode}
                  placeholder="e.g. CS-101"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                />

                <Button
                  label={submitting ? 'Saving…' : editingSubject ? 'Save Changes' : 'Add Subject to Curriculum'}
                  onPress={handleSaveSubject}
                  disabled={submitting}
                  style={{ marginTop: Spacing.four }}
                />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: Spacing.three,
  },
  filterCard: {
    marginBottom: Spacing.three,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  listTitle: {
    fontSize: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  subIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTextCol: {
    flex: 1,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  label: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 14,
  },
});
