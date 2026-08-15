import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';

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
}

const STORAGE_KEY = '@school_app_syllabus_store_v2';

const INITIAL_SYLLABUS: SyllabusChapter[] = [
  {
    id: 'math-1',
    classId: 'Class 10th',
    subject: 'Mathematics',
    chapterNumber: 1,
    title: 'Real Numbers & Polynomials',
    topics: ['Euclid Division Lemma', 'Fundamental Theorem of Arithmetic', 'Zeroes of a Polynomial'],
    completed: true,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'math-2',
    classId: 'Class 10th',
    subject: 'Mathematics',
    chapterNumber: 2,
    title: 'Pair of Linear Equations in Two Variables',
    topics: ['Graphical Method', 'Algebraic Method: Substitution & Elimination', 'Equations Reducible to Linear Form'],
    completed: true,
  },
  {
    id: 'math-3',
    classId: 'Class 10th',
    subject: 'Mathematics',
    chapterNumber: 3,
    title: 'Quadratic Equations',
    topics: ['Standard Form', 'Factorisation Method', 'Nature of Roots & Discriminant'],
    completed: false,
  },
  {
    id: 'math-4',
    classId: 'Class 10th',
    subject: 'Mathematics',
    chapterNumber: 4,
    title: 'Arithmetic Progressions',
    topics: ['nth Term of an AP', 'Sum of First n Terms of an AP'],
    completed: false,
  },
  {
    id: 'sci-1',
    classId: 'Class 10th',
    subject: 'Science',
    chapterNumber: 1,
    title: 'Chemical Reactions and Equations',
    topics: ['Chemical Equations', 'Types of Chemical Reactions', 'Corrosion and Rancidity'],
    completed: true,
  },
  {
    id: 'sci-2',
    classId: 'Class 10th',
    subject: 'Science',
    chapterNumber: 2,
    title: 'Acids, Bases and Salts',
    topics: ['Chemical Properties', 'pH Scale Concept', 'Salts & Derivatives'],
    completed: false,
  },
  {
    id: 'eng-1',
    classId: 'Class 10th',
    subject: 'English',
    chapterNumber: 1,
    title: 'A Letter to God',
    topics: ['Reading Comprehension', 'Character Sketch of Lencho', 'Grammar: Tenses & Reported Speech'],
    completed: true,
  },
];

const CLASS_OPTIONS = [
  { label: 'Class 10th', value: 'Class 10th' },
  { label: 'Class 9th', value: 'Class 9th' },
  { label: 'Class 8th', value: 'Class 8th' },
];

const SUBJECT_OPTIONS = [
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Science', value: 'Science' },
  { label: 'English', value: 'English' },
  { label: 'Social Studies', value: 'Social Studies' },
  { label: 'Hindi', value: 'Hindi' },
];

export default function SubjectSyllabusScreen() {
  const theme = useTheme();
  const { t } = useLanguage();

  const [selectedClass, setSelectedClass] = useState<string>('Class 10th');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(true);
  const [allChapters, setAllChapters] = useState<SyllabusChapter[]>(INITIAL_SYLLABUS);

  // Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Form State
  const [formChNum, setFormChNum] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formTopics, setFormTopics] = useState<string>('');
  const [formAttachmentType, setFormAttachmentType] = useState<'pdf' | 'image'>('pdf');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');
  const [formCompleted, setFormCompleted] = useState<boolean>(false);

  // Load persisted syllabus chapters
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllChapters(parsed);
          }
        } catch {}
      }
    });
  }, []);

  // Save syllabus chapters to AsyncStorage
  const saveChapters = async (updated: SyllabusChapter[]) => {
    setAllChapters(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Filtered chapters by Class & Subject
  const currentChapters = allChapters.filter(
    (c) => c.classId === selectedClass && c.subject === selectedSubject
  );
  const completedCount = currentChapters.filter((c) => c.completed).length;
  const progressPercent =
    currentChapters.length > 0 ? Math.round((completedCount / currentChapters.length) * 100) : 0;

  // Open Add Chapter Modal
  const handleOpenAddModal = () => {
    setEditingChapterId(null);
    const nextChNum = currentChapters.length + 1;
    setFormChNum(String(nextChNum));
    setFormTitle('');
    setFormTopics('');
    setFormAttachmentType('pdf');
    setFormAttachmentUrl('');
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
    setFormAttachmentUrl(ch.pdfUrl || ch.imageUrl || '');
    setFormCompleted(ch.completed);
    setModalVisible(true);
  };

  // Save / Submit Chapter Form
  const handleSaveForm = () => {
    if (!formTitle.trim()) {
      Alert.alert(t('error') || 'Error', 'Please enter a chapter title');
      return;
    }

    const parsedChNum = parseInt(formChNum, 10) || 1;
    const parsedTopics = formTopics
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let updated: SyllabusChapter[];

    if (editingChapterId) {
      updated = allChapters.map((ch) => {
        if (ch.id === editingChapterId) {
          return {
            ...ch,
            chapterNumber: parsedChNum,
            title: formTitle.trim(),
            topics: parsedTopics.length > 0 ? parsedTopics : ['General Concepts'],
            completed: formCompleted,
            pdfUrl: formAttachmentType === 'pdf' && formAttachmentUrl.trim() ? formAttachmentUrl.trim() : undefined,
            imageUrl: formAttachmentType === 'image' && formAttachmentUrl.trim() ? formAttachmentUrl.trim() : undefined,
          };
        }
        return ch;
      });
    } else {
      const newCh: SyllabusChapter = {
        id: 'ch-' + Date.now(),
        classId: selectedClass,
        subject: selectedSubject,
        chapterNumber: parsedChNum,
        title: formTitle.trim(),
        topics: parsedTopics.length > 0 ? parsedTopics : ['General Concepts'],
        completed: formCompleted,
        pdfUrl: formAttachmentType === 'pdf' && formAttachmentUrl.trim() ? formAttachmentUrl.trim() : undefined,
        imageUrl: formAttachmentType === 'image' && formAttachmentUrl.trim() ? formAttachmentUrl.trim() : undefined,
      };
      updated = [...allChapters, newCh];
    }

    saveChapters(updated);
    setModalVisible(false);
  };

  // Quick Toggle Status
  const handleToggleStatus = (ch: SyllabusChapter) => {
    const updated = allChapters.map((c) => {
      if (c.id === ch.id) {
        return { ...c, completed: !c.completed };
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
          const updated = allChapters.filter((c) => c.id !== chId);
          saveChapters(updated);
        },
      },
    ]);
  };

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
                Chapter-wise topic breakdown & completion management
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

        {/* Filter Selection Row */}
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <SelectField
              label={t('class') || 'Class'}
              options={CLASS_OPTIONS}
              value={selectedClass}
              onChange={(val) => setSelectedClass(val)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label={t('select_subject') || 'Subject'}
              options={SUBJECT_OPTIONS}
              value={selectedSubject}
              onChange={(val) => setSelectedSubject(val)}
            />
          </View>
        </View>

        {/* Progress Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <ThemedText type="smallBold" style={styles.progressTitle}>
              {selectedClass} - {t(selectedSubject)} {t('Syllabus')}
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
            message={`No chapters found for ${selectedClass} - ${selectedSubject}.`}
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
                  {/* Status Badge (Pressable for Teachers) */}
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

                  {/* Teacher Action Buttons */}
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

              {/* Topics Breakdown */}
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

              {/* Reference PDF / Photo Attachment */}
              {ch.pdfUrl || ch.imageUrl ? (
                <View style={styles.attachmentBox}>
                  {ch.imageUrl ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image source={{ uri: ch.imageUrl }} style={styles.imagePreview} resizeMode="cover" />
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() => {
                      const targetUrl = ch.pdfUrl || ch.imageUrl;
                      if (targetUrl) Linking.openURL(targetUrl).catch(() => Alert.alert('Error', 'Cannot open attachment URL'));
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
                      {ch.imageUrl ? 'View Reference Image / Diagram' : 'Download Reference Syllabus PDF'}
                    </ThemedText>
                    <Ionicons name="open-outline" size={14} color={theme.dark ? '#2DD4BF' : '#0D9488'} />
                  </Pressable>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Chapter Modal */}
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

            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
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
                  placeholder="e.g. Quadratic Equations"
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
                  placeholder={'e.g.\nEuclid Division Lemma\nFundamental Theorem of Arithmetic'}
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

              {/* Attachment Reference Type */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Attachment Reference Type
                </ThemedText>
                <View style={styles.typeSelectorRow}>
                  <Pressable
                    onPress={() => setFormAttachmentType('pdf')}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          formAttachmentType === 'pdf'
                            ? theme.dark
                              ? 'rgba(37,99,235,0.3)'
                              : '#EFF6FF'
                            : theme.dark
                            ? '#0F172A'
                            : '#F1F5F9',
                        borderColor: formAttachmentType === 'pdf' ? '#3B82F6' : theme.dark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={16} color={formAttachmentType === 'pdf' ? '#3B82F6' : theme.textSecondary} />
                    <ThemedText type="smallBold" style={{ color: formAttachmentType === 'pdf' ? (theme.dark ? '#60A5FA' : '#2563EB') : theme.textSecondary }}>
                      PDF Document
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setFormAttachmentType('image')}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          formAttachmentType === 'image'
                            ? theme.dark
                              ? 'rgba(13,148,136,0.3)'
                              : '#F0FDFA'
                            : theme.dark
                            ? '#0F172A'
                            : '#F1F5F9',
                        borderColor: formAttachmentType === 'image' ? '#0D9488' : theme.dark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Ionicons name="image-outline" size={16} color={formAttachmentType === 'image' ? '#0D9488' : theme.textSecondary} />
                    <ThemedText type="smallBold" style={{ color: formAttachmentType === 'image' ? (theme.dark ? '#2DD4BF' : '#0D9488') : theme.textSecondary }}>
                      Photo / Image
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Attachment File URL */}
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  {formAttachmentType === 'pdf' ? 'Reference PDF URL' : 'Reference Image URL'}
                </ThemedText>
                <TextInput
                  value={formAttachmentUrl}
                  onChangeText={setFormAttachmentUrl}
                  placeholder={formAttachmentType === 'pdf' ? 'https://example.com/syllabus.pdf' : 'https://example.com/diagram.jpg'}
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
                {/* Preset Sample Buttons */}
                <View style={styles.samplePresetRow}>
                  <Pressable
                    onPress={() => setFormAttachmentUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')}
                    style={styles.samplePresetBtn}
                  >
                    <ThemedText type="small" style={{ color: '#3B82F6', fontSize: 11 }}>
                      + Sample PDF Link
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setFormAttachmentUrl('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600')}
                    style={styles.samplePresetBtn}
                  >
                    <ThemedText type="small" style={{ color: '#0D9488', fontSize: 11 }}>
                      + Sample Photo Link
                    </ThemedText>
                  </Pressable>
                </View>
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

            {/* Modal Buttons */}
            <View style={styles.modalActionRow}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                  Cancel
                </ThemedText>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Button title={editingChapterId ? 'Save Changes' : 'Add Chapter'} onPress={handleSaveForm} />
              </View>
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
    height: 120,
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
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three,
    ...Shadow.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  samplePresetRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 6,
  },
  samplePresetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
