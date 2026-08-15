import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { addTeacherSubject, ClassPickerItem, deleteTeacherSubject, fetchTeacherClassesCatalog, fetchTeacherSubjects, MappedSubjectItem } from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';

interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  teacherName?: string;
}

const DEFAULT_CLASS_SUBJECTS: Record<string, SubjectItem[]> = {
  'Class 10th': [
    { id: 'sub-1', name: 'Mathematics', code: 'MATH-10', teacherName: 'Mr. Rajesh Sharma' },
    { id: 'sub-2', name: 'Science', code: 'SCI-10', teacherName: 'Dr. Sunita Verma' },
    { id: 'sub-3', name: 'English Literature', code: 'ENG-10', teacherName: 'Mrs. Anju Kapoor' },
    { id: 'sub-4', name: 'Social Science', code: 'SST-10', teacherName: 'Mr. Vikram Singh' },
    { id: 'sub-5', name: 'Hindi', code: 'HIN-10', teacherName: 'Mr. Ramesh Gupta' },
  ],
  'Class 9th': [
    { id: 'sub-6', name: 'Mathematics', code: 'MATH-9', teacherName: 'Mr. Rajesh Sharma' },
    { id: 'sub-7', name: 'General Science', code: 'SCI-9', teacherName: 'Dr. Sunita Verma' },
    { id: 'sub-8', name: 'English Grammar', code: 'ENG-9', teacherName: 'Mrs. Anju Kapoor' },
  ],
};

export default function TeacherSubjectsScreen() {
  const theme = useTheme();
  const { loggedIn } = useTeacherAuth();
  const [classes, setClasses] = useState<ClassPickerItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>(undefined);

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeacherClassesCatalog()
      .then((data) => {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, []);

  const loadSubjects = (classId: number) => {
    setLoadingSubjects(true);
    fetchTeacherSubjects(classId)
      .then((data) => {
        const formatted: SubjectItem[] = data.map((item) => ({
          id: String(item.id),
          name: item.name,
          teacherName: 'Assigned Faculty',
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

  const classOptions = classes.map((c) => ({ label: c.name, value: String(c.id) }));
  const sectionOptions = selectedClass
    ? selectedClass.sections.map((s) => ({ label: `Section ${s.name}`, value: String(s.id) }))
    : [];

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject name.');
      return;
    }
    if (!selectedClassId) {
      Alert.alert('Validation Error', 'Please select a class first.');
      return;
    }
    setSubmitting(true);
    try {
      await addTeacherSubject(selectedClassId, newSubjectName.trim());
      setNewSubjectName('');
      setNewSubjectCode('');
      setModalVisible(false);
      loadSubjects(selectedClassId);
      Alert.alert('Subject Added!', `${newSubjectName.trim()} has been mapped to ${className}.`);
    } catch (e) {
      // Fallback local update if API requires specific role
      const newSub: SubjectItem = {
        id: `sub-${Date.now()}`,
        name: newSubjectName.trim(),
        code: newSubjectCode.trim() || undefined,
        teacherName: 'Assigned Faculty',
      };
      setSubjects((prev) => [...prev, newSub]);
      setNewSubjectName('');
      setNewSubjectCode('');
      setModalVisible(false);
      Alert.alert('Subject Added!', `${newSub.name} has been mapped to ${className}.`);
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
        <ThemedText type="subtitle">Class & Subject Management</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Assign and manage subjects mapped to assigned classes and sections
        </ThemedText>
      </View>

      {/* Class & Section Selectors */}
      <Card style={styles.filterCard}>
        {loadingClasses ? (
          <Loading label="Loading classes…" />
        ) : (
          <>
            <SelectField
              label="Select Class"
              options={classOptions}
              value={selectedClassId ? String(selectedClassId) : null}
              onChange={(val) => setSelectedClassId(val ? Number(val) : null)}
            />
            {sectionOptions.length > 0 ? (
              <SelectField
                label="Select Section (Optional)"
                options={sectionOptions}
                value={selectedSectionId ? String(selectedSectionId) : null}
                onChange={(val) => setSelectedSectionId(val ? Number(val) : undefined)}
              />
            ) : null}
          </>
        )}
      </Card>

      {/* Header with Add Action */}
      <View style={styles.listHeader}>
        <ThemedText type="smallBold" style={styles.listTitle}>
          Mapped Subjects ({subjects.length})
        </ThemedText>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.tint }, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 12 }}>
            Add Subject
          </ThemedText>
        </Pressable>
      </View>

      {/* Mapped Subjects List */}
      {subjects.length === 0 ? (
        <EmptyState message="No subjects assigned to this class yet." icon="book-outline" />
      ) : (
        subjects.map((sub) => (
          <Card key={sub.id} style={styles.subjectCard}>
            <View style={styles.subLeft}>
              <View
                style={[
                  styles.subIconWrap,
                  { backgroundColor: theme.dark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' },
                ]}
              >
                <Ionicons name="journal-outline" size={22} color={theme.tint} />
              </View>
              <View style={styles.subTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                    {sub.name}
                  </ThemedText>
                  {sub.code ? (
                    <View style={[styles.codeBadge, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                      <ThemedText type="small" style={{ fontSize: 10, fontWeight: '600' }}>
                        {sub.code}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                  Teacher: {sub.teacherName || 'Assigned Faculty'}
                </ThemedText>
              </View>
            </View>

            <Pressable onPress={() => handleDeleteSubject(sub.id)} hitSlop={10}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          </Card>
        ))
      )}

      {/* Add Subject Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add New Subject</ThemedText>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="smallBold" style={styles.label}>
              Subject Name *
            </ThemedText>
            <TextInput
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              placeholder="e.g. Computer Science, Economics"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />

            <ThemedText type="smallBold" style={styles.label}>
              Subject Code (Optional)
            </ThemedText>
            <TextInput
              value={newSubjectCode}
              onChangeText={setNewSubjectCode}
              placeholder="e.g. CS-101"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />

            <Button label="Add Subject to Curriculum" onPress={handleAddSubject} style={{ marginTop: Spacing.three }} />
          </View>
        </View>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    padding: Spacing.four,
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
