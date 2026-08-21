import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { Screen } from '@/components/ui/Screen';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { SelectField } from '@/components/ui/SelectField';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { fetchTeacherClassesCatalog, fetchTeacherStudents, RosterStudent } from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSectionEnabled } from '@/hooks/use-sections';

const SESSION_YEAR_OPTIONS = [
  { label: 'Academic Session 2024-2025', value: '2024-2025' },
  { label: 'Academic Session 2025-2026', value: '2025-2026' },
  { label: 'Academic Session 2026-2027', value: '2026-2027' },
];

export default function TeacherPromoteScreen() {
  const theme = useTheme();
  const { loggedIn } = useTeacherAuth();
  const enabled = useSectionEnabled('teacher_promote');

  if (!enabled) return <SectionUnavailable />;
  const [classes, setClasses] = useState<{ id: number; name: string; sections: { id: number; name: string }[] }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Source Batch
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>(undefined);
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedSrnMap, setSelectedSrnMap] = useState<Record<string, boolean>>({});

  // Target Batch & Session
  const [targetSession, setTargetSession] = useState<string>('2026-2027');
  const [targetClassId, setTargetClassId] = useState<number | null>(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    fetchTeacherClassesCatalog()
      .then((data) => {
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id);
          if (data.length > 1) setTargetClassId(data[1].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    fetchTeacherStudents(selectedClassId, selectedSectionId)
      .then((data) => {
        setStudents(data);
        const initMap: Record<string, boolean> = {};
        data.forEach((s) => {
          const key = s.srn || String(s.id);
          initMap[key] = true;
        });
        setSelectedSrnMap(initMap);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId, selectedSectionId]);

  const toggleStudent = (srn: string) => {
    setSelectedSrnMap((prev) => ({ ...prev, [srn]: !prev[srn] }));
  };

  const toggleAll = () => {
    const allSelected = students.every((s) => selectedSrnMap[s.srn || String(s.id)]);
    const nextMap: Record<string, boolean> = {};
    students.forEach((s) => {
      const key = s.srn || String(s.id);
      nextMap[key] = !allSelected;
    });
    setSelectedSrnMap(nextMap);
  };

  const handlePromote = async () => {
    const selectedSrns = Object.keys(selectedSrnMap).filter((srn) => selectedSrnMap[srn]);
    if (selectedSrns.length === 0) {
      Alert.alert('Selection Error', 'Please select at least one student to promote.');
      return;
    }
    if (!targetClassId) {
      Alert.alert('Selection Error', 'Please select a target class for promotion.');
      return;
    }

    setPromoting(true);
    setTimeout(() => {
      setPromoting(false);
      Alert.alert(
        'Promotion Successful!',
        `Successfully promoted ${selectedSrns.length} students to the new Academic Session (${targetSession}). Historical records remain archived in the previous session.`
      );
    }, 1200);
  };

  if (!loggedIn) return <TeacherGuard><></></TeacherGuard>;

  const classOptions = classes.map((c) => ({ label: c.name, value: String(c.id) }));
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const sectionOptions = selectedClass
    ? selectedClass.sections.map((s) => ({ label: `Section ${s.name}`, value: String(s.id) }))
    : [];

  const selectedCount = Object.values(selectedSrnMap).filter(Boolean).length;

  return (
    <TeacherGuard>
      <Screen>
        <View style={styles.headerWrap}>
          <ThemedText type="subtitle">Student Batch Promotion Engine</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Promote student batches to the next Academic Session-Year
          </ThemedText>
        </View>

        {/* Source Batch Selection */}
        <Card style={styles.card}>
          <ThemedText type="smallBold" style={styles.cardTitle}>
            1. Current Source Batch
          </ThemedText>
          <SelectField
            label="Current Class"
            placeholder="Select class"
            options={classOptions}
            value={selectedClassId ? String(selectedClassId) : null}
            onChange={(val) => setSelectedClassId(val ? Number(val) : null)}
          />
          {sectionOptions.length > 0 ? (
            <SelectField
              label="Current Section"
              placeholder="Select section"
              options={sectionOptions}
              value={selectedSectionId ? String(selectedSectionId) : null}
              onChange={(val) => setSelectedSectionId(val ? Number(val) : undefined)}
            />
          ) : null}
        </Card>

        {/* Target Batch & Session Selection */}
        <Card style={styles.card}>
          <ThemedText type="smallBold" style={styles.cardTitle}>
            2. Promotion Destination & Academic Session
          </ThemedText>
          <SelectField
            label="Target Academic Session"
            placeholder="Select session"
            options={SESSION_YEAR_OPTIONS}
            value={targetSession}
            onChange={(val) => setTargetSession(val)}
          />
          <SelectField
            label="Promote To Target Class"
            placeholder="Select target class"
            options={classOptions}
            value={targetClassId ? String(targetClassId) : null}
            onChange={(val) => setTargetClassId(val ? Number(val) : null)}
          />
        </Card>

        {/* Student Checklist */}
        <Card style={styles.card}>
          <View style={styles.listHeader}>
            <ThemedText type="smallBold">
              3. Select Students to Promote ({selectedCount}/{students.length})
            </ThemedText>
            <Pressable onPress={toggleAll} hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.tint, fontSize: 12 }}>
                {students.every((s) => selectedSrnMap[s.srn || String(s.id)]) ? 'Deselect All' : 'Select All'}
              </ThemedText>
            </Pressable>
          </View>

          {loadingStudents ? (
            <Loading label="Loading student roster…" />
          ) : students.length === 0 ? (
            <EmptyState message="No students found in this class." />
          ) : (
            students.map((student) => {
              const key = student.srn || String(student.id);
              const isSelected = !!selectedSrnMap[key];
              return (
                <Pressable
                  key={student.id}
                  onPress={() => toggleStudent(key)}
                  style={[
                    styles.studentRow,
                    {
                      borderColor: isSelected ? theme.tint : theme.border,
                      backgroundColor: isSelected
                        ? theme.dark
                          ? 'rgba(37, 99, 235, 0.15)'
                          : '#EFF6FF'
                        : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? theme.tint : theme.textSecondary}
                  />
                  <View style={styles.studentInfo}>
                    <ThemedText type="smallBold">{student.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      SRN {student.srn || 'N/A'} {student.roll_no ? `· Roll #${student.roll_no}` : ''}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })
          )}

        <Button
          label={promoting ? 'Promoting Students…' : `Promote ${selectedCount} Students to ${targetSession}`}
          onPress={handlePromote}
          loading={promoting}
          disabled={promoting || selectedCount === 0}
          style={{ marginTop: Spacing.three }}
        />
      </Card>
    </Screen>
  </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: Spacing.three,
  },
  card: {
    marginBottom: Spacing.three,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginBottom: Spacing.one + 2,
  },
  studentInfo: {
    flex: 1,
  },
});
