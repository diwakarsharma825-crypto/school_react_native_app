import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { FullImageViewerModal } from '@/components/ui/FullImageViewerModal';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { SendNotificationModal } from '@/components/ui/SendNotificationModal';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { TeacherGuard } from '@/components/ui/TeacherGuard';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Spacing } from '@/constants/theme';
import {
  fetchPendingRegistrations,
  fetchTeacherStudents,
  getSavedSelectedClassId,
  PendingRegistration,
  RosterStudent,
  saveSelectedClassId,
  formatClassLabel,
} from '@/data/teacher-api';
import { useTeacherAuth } from '@/hooks/use-teacher-auth';
import { useTheme } from '@/hooks/use-theme';
import { exportStudentRosterToPdf, exportToPdf } from '@/lib/pdf-export';

function PendingRegistrationsSection({ classId, sectionId }: { classId: number; sectionId?: number }) {
  const theme = useTheme();
  const router = useRouter();
  const [pending, setPending] = useState<PendingRegistration[]>([]);

  function load() {
    fetchPendingRegistrations(classId, sectionId)
      .then(setPending)
      .catch(() => setPending([]));
  }

  useEffect(() => {
    load();
  }, [classId, sectionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [classId, sectionId])
  );

  function openReview(reg: PendingRegistration) {
    router.push({
      pathname: '/teacher-student-review',
      params: {
        id: String(reg.id),
        name: reg.name,
        className: reg.class,
        section: reg.section ?? undefined,
        srn: reg.srn ?? undefined,
        phone: reg.phone ?? undefined,
        gender: reg.gender ?? undefined,
        rollNo: reg.roll_no ?? undefined,
        fatherName: reg.father_name ?? undefined,
        motherName: reg.mother_name ?? undefined,
        photoUrl: reg.photo_url ?? undefined,
        active: String(reg.account_status),
      },
    } as any);
  }

  if (pending.length === 0) return null;

  return (
    <View style={[styles.pendingSection, { borderColor: theme.accent, backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold" style={styles.pendingTitle}>
        New student {pending.length === 1 ? 'registration' : 'registrations'} to verify
      </ThemedText>
      {pending.map((reg) => (
        <View key={reg.id} style={styles.pendingRow}>
          <View style={styles.pendingInfo}>
            <ThemedText type="smallBold">{reg.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {reg.class}
              {reg.section ? ` - ${reg.section}` : ''}
              {reg.phone ? ` · ${reg.phone}` : ''}
            </ThemedText>
          </View>
          <Pressable onPress={() => openReview(reg)} style={[styles.activateButton, { backgroundColor: theme.tint }]}>
            <ThemedText type="small" style={styles.activateButtonLabel}>
              Review
            </ThemedText>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export default function TeacherStudentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string; sectionId?: string }>();
  const { profile } = useTeacherAuth();

  const classes = profile?.classes ?? [];
  const classOptions = classes.map((c) => ({
    label: formatClassLabel(c.class_name, c.section_name),
    value: String(c.class_id),
  }));

  const [classId, setClassId] = useState<string | null>(params.classId ?? null);

  useEffect(() => {
    if (!classId) {
      getSavedSelectedClassId().then((saved) => {
        if (saved && classes.some((c) => String(c.class_id) === saved)) {
          setClassId(saved);
        } else if (classOptions[0]?.value) {
          setClassId(classOptions[0].value);
        }
      });
    }
  }, [classes, classId]);

  function handleClassChange(val: string | null) {
    setClassId(val);
    if (val) saveSelectedClassId(val);
  }
  const selectedClassObj = classes.find((c) => String(c.class_id) === classId);
  const classIdNum = Number(classId ?? classes[0]?.class_id ?? 0);
  const sectionIdNum = selectedClassObj?.section_id;

  const canAlert = profile?.permissions?.alerts !== false;
  const canImportResult = profile?.permissions?.result !== false;

  const btnBorderColor = theme.dark ? '#60A5FA' : theme.tint;
  const btnBgColor = theme.dark ? 'rgba(96, 165, 250, 0.15)' : theme.surface;
  const btnTextColor = theme.dark ? '#FFFFFF' : theme.tint;
  const primaryBtnBg = theme.dark ? '#2563EB' : theme.tint;

  const [students, setStudents] = useState<RosterStudent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [notifyTarget, setNotifyTarget] = useState<{ ref: string; name: string } | null | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; title?: string } | null>(null);

  function load() {
    if (!classIdNum) return;
    setLoading(true);
    setError(false);
    fetchTeacherStudents(classIdNum, sectionIdNum ?? undefined)
      .then(setStudents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [classIdNum, sectionIdNum]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [classIdNum, sectionIdNum])
  );

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.father_name ?? '').toLowerCase().includes(q) ||
        (s.roll_no ?? '').toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q)
    );
  }, [students, query]);

  const activeCount = students?.filter((s) => s.enrollment_status === 1).length ?? 0;
  const inactiveCount = (students?.length ?? 0) - activeCount;
  const classLabel = selectedClassObj?.class_name ?? '';
  const sectionLabel = selectedClassObj?.section_name ?? '';

  return (
    <TeacherGuard>
      <Screen>
        <View style={[styles.hero, { backgroundColor: theme.tint }]}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={18} color={Brand.white} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={styles.heroTitle}>
              Student Management
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtitle} numberOfLines={1}>
              Manage enrolled students, verify registrations, and export reports.
            </ThemedText>
          </View>
        </View>

        {classes.length > 0 ? (
          <SelectField label="Class" placeholder="Select class" value={classId} options={classOptions} onChange={handleClassChange} />
        ) : null}

        <PendingRegistrationsSection classId={classIdNum} sectionId={sectionIdNum ?? undefined} />

        <View style={styles.toolbarGrid}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/teacher-add-student',
                params: { classId: String(classIdNum), sectionId: sectionIdNum ? String(sectionIdNum) : '' },
              } as any)
            }
            style={[styles.actionBtn, { backgroundColor: primaryBtnBg }]}
          >
            <Ionicons name="person-add-outline" size={16} color={Brand.white} />
            <ThemedText type="smallBold" style={{ color: Brand.white }}>
              Add Student
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: '/teacher-import-students',
                params: { classId: String(classIdNum), sectionId: sectionIdNum ? String(sectionIdNum) : '' },
              } as any)
            }
            style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: btnBorderColor, backgroundColor: btnBgColor }]}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={btnTextColor} />
            <ThemedText type="smallBold" style={{ color: btnTextColor }}>
              Import Excel
            </ThemedText>
          </Pressable>

          <ExportPdfButton
            variant="outline"
            style={styles.actionBtn}
            onPress={() => {
              if (!filteredStudents || filteredStudents.length === 0) return;
              exportStudentRosterToPdf({
                title: `Class Roster Report - ${classLabel}${sectionLabel ? ` (${sectionLabel})` : ''}`,
                subtitle: `Total Students: ${filteredStudents.length}${query ? ` | Filter: "${query}"` : ''}`,
                students: filteredStudents,
              });
            }}
          />

          {canAlert ? (
            <Pressable
              onPress={() => setNotifyTarget(null)}
              style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: btnBorderColor, backgroundColor: btnBgColor }]}
            >
              <Ionicons name="notifications-outline" size={16} color={btnTextColor} />
              <ThemedText type="smallBold" style={{ color: btnTextColor }}>
                Notify Class
              </ThemedText>
            </Pressable>
          ) : null}

          {canImportResult ? (
            <Pressable
              onPress={() => router.push('/teacher-import-result' as any)}
              style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: btnBorderColor, backgroundColor: btnBgColor }]}
            >
              <Ionicons name="document-attach-outline" size={16} color={btnTextColor} />
              <ThemedText type="smallBold" style={{ color: btnTextColor }}>
                Import Result
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <SendNotificationModal
          visible={notifyTarget !== undefined}
          onClose={() => setNotifyTarget(undefined)}
          classId={classIdNum}
          sectionId={sectionIdNum ?? undefined}
          target={notifyTarget ?? null}
        />

        {loading ? (
          <Loading label="Loading class students…" />
        ) : error ? (
          <ErrorState message="Could not load students." onRetry={load} />
        ) : !students || students.length === 0 ? (
          <EmptyState message="No students enrolled in this class yet." icon="people-outline" />
        ) : (
          <>
            <View style={[styles.searchBox, { borderColor: theme.border }]}>
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, roll no, father's name, mobile"
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.countRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.rosterCount}>
                {students.length} {students.length === 1 ? 'STUDENT' : 'STUDENTS'} ({activeCount} active · {inactiveCount} inactive)
              </ThemedText>
              <View style={[styles.viewToggle, { borderColor: theme.border }]}>
                <Pressable
                  onPress={() => setViewMode('list')}
                  style={[styles.viewToggleButton, viewMode === 'list' && { backgroundColor: theme.tint }]}
                >
                  <Ionicons name="list" size={15} color={viewMode === 'list' ? Brand.white : theme.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('grid')}
                  style={[styles.viewToggleButton, viewMode === 'grid' && { backgroundColor: theme.tint }]}
                >
                  <Ionicons name="grid" size={15} color={viewMode === 'grid' ? Brand.white : theme.textSecondary} />
                </Pressable>
              </View>
            </View>

            {filteredStudents.length === 0 ? (
              <EmptyState message="No students match your search." icon="search-outline" />
            ) : viewMode === 'grid' ? (
              <View style={styles.studentGrid}>
                {filteredStudents.map((s) => {
                  const active = s.enrollment_status === 1;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() =>
                        router.push({
                          pathname: '/teacher-student-review',
                          params: {
                            id: String(s.id).replace('reg-', ''),
                            name: s.name,
                            className: classLabel,
                            section: sectionLabel,
                            srn: s.srn ?? undefined,
                            phone: s.phone ?? undefined,
                            gender: s.gender ?? undefined,
                            rollNo: s.roll_no ?? undefined,
                            fatherName: s.father_name ?? undefined,
                            motherName: s.mother_name ?? undefined,
                            photoUrl: s.photo_url ?? undefined,
                            active: String(s.enrollment_status),
                          },
                        } as any)
                      }
                      style={styles.gridCard}
                    >
                      {s.photo_url ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            if (s.photo_url) setViewingPhoto({ url: s.photo_url, title: s.name });
                          }}
                        >
                          <Image source={{ uri: s.photo_url }} style={styles.gridPhoto} contentFit="cover" />
                        </Pressable>
                      ) : (
                        <View style={[styles.gridPhoto, styles.studentPhotoFallback, { backgroundColor: theme.backgroundSelected }]}>
                          <Ionicons name="person" size={26} color={theme.textSecondary} />
                        </View>
                      )}
                      <View style={[styles.statusDot, { backgroundColor: active ? '#2E7D32' : '#C62828' }]} />
                      <ThemedText type="small" numberOfLines={1} style={styles.gridName}>
                        {s.name}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {s.roll_no ? `Roll ${s.roll_no}` : '—'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              filteredStudents.map((s) => {
                const active = s.enrollment_status === 1;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() =>
                      router.push({
                        pathname: '/teacher-student-review',
                        params: {
                          id: String(s.id).replace('reg-', ''),
                          name: s.name,
                          className: classLabel,
                          section: sectionLabel,
                          rollNo: s.roll_no ?? undefined,
                          fatherName: s.father_name ?? undefined,
                          motherName: s.mother_name ?? undefined,
                          photoUrl: s.photo_url ?? undefined,
                          active: String(s.enrollment_status),
                        },
                      } as any)
                    }
                  >
                    <Card style={styles.studentRow}>
                      {s.photo_url ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            if (s.photo_url) setViewingPhoto({ url: s.photo_url, title: s.name });
                          }}
                        >
                          <Image source={{ uri: s.photo_url }} style={styles.studentPhoto} contentFit="cover" />
                        </Pressable>
                      ) : (
                        <View style={[styles.studentPhoto, styles.studentPhotoFallback, { backgroundColor: theme.backgroundSelected }]}>
                          <Ionicons name="person" size={18} color={theme.textSecondary} />
                        </View>
                      )}
                      <View style={styles.studentInfo}>
                        <View style={styles.studentNameRow}>
                          <ThemedText type="smallBold" style={styles.studentNameText}>
                            {s.name}
                          </ThemedText>
                          <View style={[styles.statusTag, { backgroundColor: active ? '#DFF1E1' : '#FBE2E2' }]}>
                            <ThemedText type="small" style={{ color: active ? '#2E7D32' : '#C62828' }}>
                              {active ? 'Active' : 'Inactive'}
                            </ThemedText>
                          </View>
                        </View>
                        {s.father_name ? (
                          <ThemedText type="small" themeColor="textSecondary">
                            Father: {s.father_name}
                          </ThemedText>
                        ) : null}
                        <ThemedText type="small" themeColor="textSecondary">
                          {s.roll_no ? `Roll No. ${s.roll_no}` : 'No roll number'}
                          {s.phone ? ` · ${s.phone}` : ''}
                        </ThemedText>
                      </View>
                      {canAlert ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setNotifyTarget({ ref: String(s.id), name: s.name });
                          }}
                          hitSlop={8}
                          style={styles.notifyBellButton}
                        >
                          <Ionicons name="notifications-outline" size={18} color={theme.tint} />
                        </Pressable>
                      ) : null}
                      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                    </Card>
                  </Pressable>
                );
              })
            )}
          </>
        )}
        <FullImageViewerModal
          visible={!!viewingPhoto}
          photoUrl={viewingPhoto?.url}
          title={viewingPhoto?.title}
          onClose={() => setViewingPhoto(null)}
        />
      </Screen>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.two,
  },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: Brand.white,
    fontSize: 15,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  pendingSection: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  pendingTitle: {
    marginBottom: Spacing.two,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  pendingInfo: {
    flex: 1,
    gap: 2,
  },
  activateButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  activateButtonLabel: {
    color: Brand.white,
  },
  toolbarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  actionBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  actionBtnOutline: {
    borderWidth: 1.5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  rosterCount: {
    letterSpacing: 0.5,
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
  },
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridCard: {
    width: '30%',
    alignItems: 'center',
    gap: 2,
  },
  gridPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.one,
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: '30%',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  gridName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  studentPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  studentPhotoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  studentNameText: {
    flexShrink: 1,
  },
  statusTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  notifyBellButton: {
    marginRight: Spacing.two,
  },
});
