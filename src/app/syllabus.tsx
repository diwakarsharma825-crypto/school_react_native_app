import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/states';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';
import {
  addSyllabusChapterApi,
  ClassPickerItem,
  deleteSyllabusChapterApi,
  editSyllabusChapterApi,
  fetchSyllabusApi,
  fetchSubjectsCatalog,
  fetchTeacherClassesCatalog,
  toggleSyllabusStatusApi,
} from '@/data/teacher-api';

export interface SyllabusChapter {
  id: string;
  classId: string;
  subject: string;
  chapterNumber: number;
  title: string;
  topics: string[];
  completed: boolean;
  pdfUrl?: string;
  imageUrl?: string;
  fileName?: string;
}

const STORAGE_KEY = '@school_app_syllabus_store_v5';

const DEFAULT_CLASSES = [
  { id: 1, name: 'Class 1st - A' },
  { id: 2, name: 'Class 2nd - A' },
  { id: 3, name: 'UKG - A' },
];

const DEFAULT_SUBJECTS = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'English' },
  { id: 4, name: 'Hindi' },
];

export default function SubjectSyllabusScreen() {
  const theme = useTheme();
  const { t } = useLanguage();

  // Class & Subject Options
  const [teacherClasses, setTeacherClasses] = useState<ClassPickerItem[]>(DEFAULT_CLASSES);
  const [subjectList, setSubjectList] = useState<{ id: number; name: string }[]>(DEFAULT_SUBJECTS);

  const [selectedClass, setSelectedClass] = useState<string>('Class 1st - A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');

  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(true);
  const [allChapters, setAllChapters] = useState<SyllabusChapter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // In-App Viewer Modal State (PDF / Image)
  const [activeAttachment, setActiveAttachment] = useState<{
    url: string;
    type: 'pdf' | 'image';
    name: string;
  } | null>(null);

  // Form State
  const [formChNum, setFormChNum] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formTopics, setFormTopics] = useState<string>('');
  const [formAttachmentType, setFormAttachmentType] = useState<'pdf' | 'image'>('pdf');
  const [formAttachmentUri, setFormAttachmentUri] = useState<string>('');
  const [formAttachmentName, setFormAttachmentName] = useState<string>('');
  const [formCompleted, setFormCompleted] = useState<boolean>(false);

  // 1. Fetch Teacher's Assigned Classes Catalog
  useEffect(() => {
    async function loadClasses() {
      try {
        const classes = await fetchTeacherClassesCatalog();
        if (classes && classes.length > 0) {
          setTeacherClasses(classes);
          setSelectedClass(classes[0].name);
        }
      } catch {}
    }
    loadClasses();
  }, []);

  // 2. Fetch Subjects According to Selected Class
  useEffect(() => {
    async function loadSubjects() {
      const match = teacherClasses.find((c) => c.name === selectedClass);
      const classId = match ? match.id : 1;
      try {
        const subs = await fetchSubjectsCatalog(classId);
        if (subs && subs.length > 0) {
          setSubjectList(subs);
          setSelectedSubject(subs[0].name);
        }
      } catch {
        setSubjectList(DEFAULT_SUBJECTS);
      }
    }
    loadSubjects();
  }, [selectedClass, teacherClasses]);

  // 3. Load Syllabus Data Exclusively from Backend API
  const loadSyllabusData = async () => {
    setIsLoading(true);
    try {
      const apiRows = await fetchSyllabusApi(selectedClass, selectedSubject);
      if (apiRows && Array.isArray(apiRows)) {
        const mapped: SyllabusChapter[] = apiRows.map((r) => ({
          id: String(r.id),
          classId: r.class || selectedClass,
          subject: r.subject || selectedSubject,
          chapterNumber: r.chapter_number,
          title: r.chapter_title,
          topics: Array.isArray(r.topics) ? r.topics : [],
          completed: Boolean(r.status || r.completed),
          pdfUrl: r.pdf_url || undefined,
          imageUrl: r.image_url || undefined,
          fileName: r.pdf_url ? 'Reference_Document.pdf' : r.image_url ? 'Reference_Image.png' : undefined,
        }));

        setAllChapters((prev) => {
          const filteredOther = prev.filter(
            (c) => !(c.classId === selectedClass && c.subject === selectedSubject)
          );
          return [...filteredOther, ...mapped];
        });
        setIsLoading(false);
        return;
      }
    } catch {}

    // Fallback to AsyncStorage cache
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setAllChapters(parsed);
          }
        } catch {}
      }
    });
    setIsLoading(false);
  };

  useEffect(() => {
    loadSyllabusData();
  }, [selectedClass, selectedSubject]);

  // Save Syllabus to Storage & State
  const saveChapters = async (updated: SyllabusChapter[]) => {
    setAllChapters(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Filtered chapters for current Class & Subject
  const currentChapters = allChapters.filter(
    (c) => c.classId === selectedClass && c.subject === selectedSubject
  );
  const completedCount = currentChapters.filter((c) => c.completed).length;
  const progressPercent =
    currentChapters.length > 0 ? Math.round((completedCount / currentChapters.length) * 100) : 0;

  // File Upload Handlers (Image / PDF Picker)
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setFormAttachmentType('pdf');
        setFormAttachmentUri(asset.uri);
        setFormAttachmentName(asset.name || 'Syllabus_Document.pdf');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not select document');
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access permission is required to upload images.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setFormAttachmentType('image');
        setFormAttachmentUri(asset.uri);
        setFormAttachmentName(asset.fileName || 'Syllabus_Diagram.jpg');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not select image');
    }
  };

  // Open Add Chapter Modal
  const handleOpenAddModal = () => {
    setEditingChapterId(null);
    const nextChNum = currentChapters.length + 1;
    setFormChNum(String(nextChNum));
    setFormTitle('');
    setFormTopics('');
    setFormAttachmentType('pdf');
    setFormAttachmentUri('');
    setFormAttachmentName('');
    setFormCompleted(false);
    setModalVisible(true);
  };

  // Open Edit Chapter Modal
  const handleOpenEditModal = (ch: SyllabusChapter) => {
    setEditingChapterId(ch.id);
    setFormChNum(String(ch.chapterNumber));
    setFormTitle(ch.title);
    setFormTopics(ch.topics.join('\n'));
    setFormAttachmentType(ch.imageUrl ? 'image' : 'pdf');
    setFormAttachmentUri(ch.pdfUrl || ch.imageUrl || '');
    setFormAttachmentName(ch.fileName || (ch.pdfUrl ? 'Reference_Document.pdf' : ch.imageUrl ? 'Reference_Image.png' : ''));
    setFormCompleted(ch.completed);
    setModalVisible(true);
  };

  // Save / Submit Chapter Form
  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Required', 'Please enter a chapter title');
      return;
    }

    const parsedChNum = parseInt(formChNum, 10) || 1;
    const parsedTopics = formTopics
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const topicsArray = parsedTopics.length > 0 ? parsedTopics : ['General Concepts'];

    const pdfUrl = formAttachmentType === 'pdf' && formAttachmentUri ? formAttachmentUri : undefined;
    const imageUrl = formAttachmentType === 'image' && formAttachmentUri ? formAttachmentUri : undefined;

    let updated: SyllabusChapter[];

    if (editingChapterId) {
      // Call Backend API Edit
      editSyllabusChapterApi({
        id: editingChapterId,
        chapter_number: parsedChNum,
        chapter_title: formTitle.trim(),
        topics: topicsArray,
        status: formCompleted ? 1 : 0,
        pdf_url: pdfUrl,
        image_url: imageUrl,
      }).catch(() => {});

      updated = allChapters.map((ch) => {
        if (ch.id === editingChapterId) {
          return {
            ...ch,
            chapterNumber: parsedChNum,
            title: formTitle.trim(),
            topics: topicsArray,
            completed: formCompleted,
            pdfUrl,
            imageUrl,
            fileName: formAttachmentName || (pdfUrl ? 'Reference_Document.pdf' : imageUrl ? 'Reference_Image.png' : undefined),
          };
        }
        return ch;
      });
    } else {
      let createdId = 'ch-' + Date.now();
      try {
        const apiRes = await addSyllabusChapterApi({
          class: selectedClass,
          subject: selectedSubject,
          chapter_number: parsedChNum,
          chapter_title: formTitle.trim(),
          topics: topicsArray,
          status: formCompleted ? 1 : 0,
          pdf_url: pdfUrl,
          image_url: imageUrl,
        });
        if (apiRes && apiRes.id) createdId = String(apiRes.id);
      } catch {}

      const newCh: SyllabusChapter = {
        id: createdId,
        classId: selectedClass,
        subject: selectedSubject,
        chapterNumber: parsedChNum,
        title: formTitle.trim(),
        topics: topicsArray,
        completed: formCompleted,
        pdfUrl,
        imageUrl,
        fileName: formAttachmentName || (pdfUrl ? 'Reference_Document.pdf' : imageUrl ? 'Reference_Image.png' : undefined),
      };
      updated = [...allChapters, newCh];
    }

    saveChapters(updated);
    setModalVisible(false);
  };

  // Quick Toggle Status
  const handleToggleStatus = (ch: SyllabusChapter) => {
    const nextStatus = !ch.completed;
    toggleSyllabusStatusApi(ch.id, nextStatus ? 1 : 0).catch(() => {});

    const updated = allChapters.map((c) => {
      if (c.id === ch.id) {
        return { ...c, completed: nextStatus };
      }
      return c;
    });
    saveChapters(updated);
  };

  // Delete Chapter
  const handleDeleteChapter = (chId: string) => {
    Alert.alert('Delete Chapter', 'Are you sure you want to remove this chapter from the syllabus?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSyllabusChapterApi(chId).catch(() => {});
          const updated = allChapters.filter((c) => c.id !== chId);
          saveChapters(updated);
        },
      },
    ]);
  };

  // Map options for SelectFields
  const classOptions = teacherClasses.map((c) => ({ label: c.name, value: c.name }));
  const subjectOptions = subjectList.map((s) => ({ label: s.name, value: s.name }));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header & Role Banner */}
        <View style={styles.headerWrap}>
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" style={styles.mainTitle}>
                {t('syllabus')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Assigned class & subject curriculum management
              </ThemedText>
            </View>
            <Pressable
              onPress={() => setIsTeacherMode(!isTeacherMode)}
              style={[
                styles.modeBtn,
                {
                  backgroundColor: isTeacherMode
                    ? theme.dark
                      ? 'rgba(37,99,235,0.25)'
                      : '#EFF6FF'
                    : theme.dark
                    ? 'rgba(255,255,255,0.1)'
                    : '#F1F5F9',
                  borderColor: isTeacherMode ? '#3B82F6' : theme.dark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Ionicons
                name={isTeacherMode ? 'school-outline' : 'person-outline'}
                size={16}
                color={isTeacherMode ? (theme.dark ? '#60A5FA' : '#2563EB') : theme.textSecondary}
              />
              <ThemedText
                type="smallBold"
                style={{
                  color: isTeacherMode ? (theme.dark ? '#60A5FA' : '#2563EB') : theme.textSecondary,
                  fontSize: 12,
                }}
              >
                {isTeacherMode ? 'Teacher Mode' : 'Student Mode'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Filter Selection Row: Filtered to Assigned Teacher Classes & Corresponding Subjects */}
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <SelectField
              label={t('class') || 'Teacher Class'}
              options={classOptions}
              value={selectedClass}
              onChange={(val) => setSelectedClass(val)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label={t('select_subject') || 'Subject'}
              options={subjectOptions}
              value={selectedSubject}
              onChange={(val) => setSelectedSubject(val)}
            />
          </View>
        </View>

        {/* Progress Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <ThemedText type="smallBold" style={styles.progressTitle}>
              {selectedClass} - {selectedSubject} Syllabus
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.dark ? '#60A5FA' : '#2563EB' }}>
              {progressPercent}% {t('Completed')}
            </ThemedText>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.15)' : '#E2E8F0' }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressPercent}%`, backgroundColor: theme.dark ? '#3B82F6' : '#2563EB' },
              ]}
            />
          </View>

          <View style={styles.progressBottom}>
            <ThemedText type="small" themeColor="textSecondary">
              {completedCount} / {currentChapters.length} {t('Chapters Covered')}
            </ThemedText>
            {isTeacherMode ? (
              <Pressable
                onPress={handleOpenAddModal}
                style={({ pressed }) => [
                  styles.addChBtn,
                  { backgroundColor: theme.dark ? '#2563EB' : '#1D4ED8' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 12 }}>
                  + Add Chapter
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </Card>

        {/* Chapter List */}
        {currentChapters.length === 0 ? (
          <EmptyState
            message={`No syllabus chapters added yet for ${selectedClass} - ${selectedSubject}.`}
            icon="book-outline"
          />
        ) : (
          currentChapters.map((ch) => (
            <Card key={ch.id} style={styles.chapterCard}>
              {/* Chapter Header */}
              <View style={styles.chapterHeader}>
                <View style={styles.chTitleCol}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.dark ? 'rgba(37,99,235,0.25)' : '#EFF6FF', borderColor: theme.dark ? '#3B82F6' : '#BFDBFE' },
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.dark ? '#60A5FA' : '#2563EB', fontSize: 11 }}>
                      CH {ch.chapterNumber}
                    </ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={styles.chTitle}>
                    {ch.title}
                  </ThemedText>
                </View>

                <View style={styles.headerRightActions}>
                  {/* Status Badge (Pressable for Teachers to Toggle) */}
                  <Pressable
                    disabled={!isTeacherMode}
                    onPress={() => handleToggleStatus(ch)}
                    style={({ pressed }) => [
                      styles.statusPill,
                      {
                        backgroundColor: ch.completed
                          ? theme.dark
                            ? 'rgba(34,197,94,0.25)'
                            : '#DCFCE7'
                          : theme.dark
                          ? 'rgba(234,179,8,0.25)'
                          : '#FEF3C7',
                        borderColor: ch.completed ? '#22C55E' : '#EAB308',
                      },
                      pressed && isTeacherMode && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons
                      name={ch.completed ? 'checkmark-circle' : 'time-outline'}
                      size={14}
                      color={ch.completed ? (theme.dark ? '#4ADE80' : '#16A34A') : (theme.dark ? '#FACC15' : '#D97706')}
                    />
                    <ThemedText
                      type="small"
                      style={{
                        color: ch.completed
                          ? theme.dark
                            ? '#86EFAC'
                            : '#15803D'
                          : theme.dark
                          ? '#FDE047'
                          : '#B45309',
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {ch.completed ? 'Completed' : 'In Progress'}
                    </ThemedText>
                  </Pressable>

                  {/* Teacher Action Controls: Edit & Delete */}
                  {isTeacherMode ? (
                    <View style={styles.actionBtnRow}>
                      <Pressable
                        onPress={() => handleOpenEditModal(ch)}
                        style={({ pressed }) => [
                          styles.iconBtn,
                          { backgroundColor: theme.dark ? 'rgba(59,130,246,0.2)' : '#EFF6FF', borderColor: '#3B82F6' },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Ionicons name="pencil-outline" size={15} color={theme.dark ? '#60A5FA' : '#2563EB'} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteChapter(ch.id)}
                        style={({ pressed }) => [
                          styles.iconBtn,
                          { backgroundColor: theme.dark ? 'rgba(239,68,68,0.2)' : '#FEF2F2', borderColor: '#EF4444' },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Ionicons name="trash-outline" size={15} color={theme.dark ? '#FCA5A5' : '#DC2626'} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Sub-Topics */}
              <View style={styles.topicsList}>
                {ch.topics.map((topic, i) => (
                  <View key={i} style={styles.topicRow}>
                    <Ionicons name="ellipse" size={6} color={theme.dark ? '#94A3B8' : '#64748B'} style={{ marginTop: 6 }} />
                    <ThemedText type="body" style={styles.topicText}>
                      {topic}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Uploaded Reference PDF / Photo Attachment */}
              {ch.pdfUrl || ch.imageUrl ? (
                <View style={styles.attachmentBox}>
                  {ch.imageUrl ? (
                    <Pressable
                      onPress={() =>
                        setActiveAttachment({
                          url: ch.imageUrl!,
                          type: 'image',
                          name: ch.fileName || 'Reference_Image.png',
                        })
                      }
                      style={styles.imagePreviewWrap}
                    >
                      <Image source={{ uri: ch.imageUrl }} style={styles.imagePreview} resizeMode="cover" />
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={() => {
                      const targetUrl = ch.pdfUrl || ch.imageUrl;
                      if (targetUrl) {
                        setActiveAttachment({
                          url: targetUrl,
                          type: ch.imageUrl ? 'image' : 'pdf',
                          name: ch.fileName || (ch.imageUrl ? 'Reference_Image.png' : 'Reference_Document.pdf'),
                        });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.attachBtn,
                      {
                        backgroundColor: theme.dark ? 'rgba(13,148,136,0.2)' : '#F0FDFA',
                        borderColor: theme.dark ? '#2DD4BF' : '#0D9488',
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons
                      name={ch.imageUrl ? 'image-outline' : 'document-text-outline'}
                      size={18}
                      color={theme.dark ? '#2DD4BF' : '#0D9488'}
                    />
                    <ThemedText
                      type="smallBold"
                      style={{ color: theme.dark ? '#2DD4BF' : '#0D9488', fontSize: 12, flex: 1 }}
                    >
                      {ch.fileName || (ch.imageUrl ? 'View Uploaded Image' : 'View Uploaded PDF Document')}
                    </ThemedText>
                    <Ionicons name="eye-outline" size={16} color={theme.dark ? '#2DD4BF' : '#0D9488'} />
                  </Pressable>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* In-App PDF & Image Viewer Modal (Displays inside App, Never opens outside) */}
      <Modal
        visible={!!activeAttachment}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setActiveAttachment(null)}
      >
        <View style={styles.viewerOverlay}>
          <View
            style={[
              styles.viewerCard,
              {
                backgroundColor: theme.dark ? '#1E293B' : '#FFFFFF',
                borderColor: theme.dark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <View style={[styles.viewerHeader, { borderBottomColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
              <Ionicons
                name={activeAttachment?.type === 'image' ? 'image' : 'document-text'}
                size={20}
                color={theme.dark ? '#60A5FA' : '#2563EB'}
              />
              <ThemedText type="subtitle" style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>
                {activeAttachment?.name || 'In-App Attachment Viewer'}
              </ThemedText>
              <Pressable onPress={() => setActiveAttachment(null)}>
                <Ionicons name="close-circle" size={26} color={theme.dark ? '#94A3B8' : '#64748B'} />
              </Pressable>
            </View>

            <View style={styles.viewerBody}>
              {activeAttachment?.type === 'image' ? (
                <Image
                  source={{ uri: activeAttachment.url }}
                  style={styles.fullViewerImage}
                  resizeMode="contain"
                />
              ) : (
                typeof window !== 'undefined' ? (
                  <iframe
                    src={activeAttachment?.url}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                    title="In-App Document Viewer"
                  />
                ) : (
                  <View style={styles.pdfFallbackBox}>
                    <Ionicons name="document-text" size={48} color="#3B82F6" />
                    <ThemedText type="subtitle" style={{ marginTop: 12, textAlign: 'center' }}>
                      {activeAttachment?.name || 'Syllabus Document'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
                      Document loaded inside school app.
                    </ThemedText>
                  </View>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Chapter Modal with Real File Upload Buttons & High-Contrast Submit Button */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.dark ? '#1E293B' : '#FFFFFF', borderColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                {editingChapterId ? 'Edit Chapter' : 'Add New Chapter'}
              </ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.two }} showsVerticalScrollIndicator={true}>
              {/* Chapter Number */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Chapter Number *
                </ThemedText>
                <TextInput
                  value={formChNum}
                  onChangeText={setFormChNum}
                  keyboardType="numeric"
                  placeholder="e.g. 1"
                  placeholderTextColor={theme.dark ? '#64748B' : '#94A3B8'}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.dark ? '#0F172A' : '#F8FAFC',
                      borderColor: theme.dark ? '#334155' : '#CBD5E1',
                      color: theme.dark ? '#FFFFFF' : '#0F172A',
                    },
                  ]}
                />
              </View>

              {/* Chapter Title */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Chapter Title *
                </ThemedText>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Living & Non-Living Things"
                  placeholderTextColor={theme.dark ? '#64748B' : '#94A3B8'}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.dark ? '#0F172A' : '#F8FAFC',
                      borderColor: theme.dark ? '#334155' : '#CBD5E1',
                      color: theme.dark ? '#FFFFFF' : '#0F172A',
                    },
                  ]}
                />
              </View>

              {/* Sub-Topics */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Sub-Topics (One per line)
                </ThemedText>
                <TextInput
                  value={formTopics}
                  onChangeText={setFormTopics}
                  multiline={true}
                  numberOfLines={4}
                  placeholder={'e.g.\nCounting numbers 1-50\nPicture addition & subtraction'}
                  placeholderTextColor={theme.dark ? '#64748B' : '#94A3B8'}
                  style={[
                    styles.inputField,
                    styles.textArea,
                    {
                      backgroundColor: theme.dark ? '#0F172A' : '#F8FAFC',
                      borderColor: theme.dark ? '#334155' : '#CBD5E1',
                      color: theme.dark ? '#FFFFFF' : '#0F172A',
                    },
                  ]}
                />
              </View>

              {/* Attachment Upload Section (Photo / PDF Picker) */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Upload Reference Attachment (PDF / Photo)
                </ThemedText>

                <View style={styles.uploadBtnRow}>
                  <Pressable
                    onPress={handlePickDocument}
                    style={({ pressed }) => [
                      styles.fileUploadBtn,
                      {
                        backgroundColor: theme.dark ? 'rgba(37,99,235,0.25)' : '#EFF6FF',
                        borderColor: theme.dark ? '#3B82F6' : '#2563EB',
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={18} color={theme.dark ? '#60A5FA' : '#2563EB'} />
                    <ThemedText type="smallBold" style={{ color: theme.dark ? '#60A5FA' : '#2563EB', fontSize: 12 }}>
                      📂 Choose PDF File
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handlePickImage}
                    style={({ pressed }) => [
                      styles.fileUploadBtn,
                      {
                        backgroundColor: theme.dark ? 'rgba(13,148,136,0.25)' : '#F0FDFA',
                        borderColor: theme.dark ? '#2DD4BF' : '#0D9488',
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="image-outline" size={18} color={theme.dark ? '#2DD4BF' : '#0D9488'} />
                    <ThemedText type="smallBold" style={{ color: theme.dark ? '#2DD4BF' : '#0D9488', fontSize: 12 }}>
                      🖼️ Choose Photo
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Selected File Card / Preview */}
                {formAttachmentUri ? (
                  <View
                    style={[
                      styles.selectedFileCard,
                      {
                        backgroundColor: theme.dark ? '#0F172A' : '#F1F5F9',
                        borderColor: theme.dark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Ionicons
                      name={formAttachmentType === 'image' ? 'image' : 'document-text'}
                      size={22}
                      color={formAttachmentType === 'image' ? '#0D9488' : '#2563EB'}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" numberOfLines={1} style={{ fontSize: 12 }}>
                        {formAttachmentName || 'Attached_File.' + formAttachmentType}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                        Ready to attach to chapter
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => {
                        setFormAttachmentUri('');
                        setFormAttachmentName('');
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {/* Completion Status Check */}
              <Pressable
                onPress={() => setFormCompleted(!formCompleted)}
                style={[
                  styles.statusCheckRow,
                  {
                    backgroundColor: formCompleted
                      ? theme.dark
                        ? 'rgba(34,197,94,0.2)'
                        : '#DCFCE7'
                      : theme.dark
                      ? '#0F172A'
                      : '#F8FAFC',
                    borderColor: formCompleted ? '#22C55E' : theme.dark ? '#334155' : '#CBD5E1',
                  },
                ]}
              >
                <Ionicons
                  name={formCompleted ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={formCompleted ? '#22C55E' : theme.textSecondary}
                />
                <ThemedText type="smallBold" style={{ color: formCompleted ? (theme.dark ? '#86EFAC' : '#15803D') : theme.textSecondary }}>
                  Mark Chapter as Completed
                </ThemedText>
              </Pressable>
            </ScrollView>

            {/* High Contrast Modal Submit Button Pinned to Bottom */}
            <View style={[styles.modalActionRow, { borderTopColor: theme.dark ? '#334155' : '#E2E8F0' }]}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[
                  styles.modalCancelBtn,
                  {
                    backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                    borderColor: theme.dark ? '#475569' : '#CBD5E1',
                  },
                ]}
              >
                <ThemedText type="smallBold" style={{ color: theme.dark ? '#CBD5E1' : '#475569', fontSize: 13 }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleSaveForm}
                style={({ pressed }) => [
                  styles.modalSubmitBtn,
                  { backgroundColor: '#2563EB' },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                  {editingChapterId ? 'Save Changes' : 'Add Chapter'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  headerWrap: {
    marginBottom: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  progressCard: {
    marginVertical: Spacing.two,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  progressTitle: {
    fontSize: 14,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  addChBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.medium,
  },
  chapterCard: {
    marginBottom: Spacing.three,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  chTitleCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  headerRightActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  iconBtn: {
    padding: 6,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  topicsList: {
    gap: 8,
    paddingLeft: Spacing.one,
    marginVertical: Spacing.two,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  topicText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  attachmentBox: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  imagePreviewWrap: {
    borderRadius: Radius.medium,
    overflow: 'hidden',
    height: 140,
    backgroundColor: '#000000',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  /* In-App Media Viewer Modal */
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  viewerCard: {
    width: '95%',
    maxWidth: 600,
    height: '80%',
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three,
    display: 'flex',
    flexDirection: 'column',
    ...Shadow.card,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  viewerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullViewerImage: {
    width: '100%',
    height: '100%',
  },
  pdfFallbackBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  /* Form Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three,
    display: 'flex',
    flexDirection: 'column',
    ...Shadow.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    marginBottom: 6,
    fontSize: 13,
  },
  inputField: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  uploadBtnRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: 8,
  },
  fileUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginTop: 6,
  },
  statusCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
    borderTopWidth: 1,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  modalSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.medium,
  },
});
