import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/states';
import { Screen } from '@/components/ui/Screen';
import { SelectField } from '@/components/ui/SelectField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';

export interface SyllabusChapter {
  id: string;
  chapterNumber: number;
  title: string;
  topics: string[];
  completed: boolean;
  pdfUrl?: string;
  videoUrl?: string;
}

const SUBJECT_SYLLABUS: Record<string, SyllabusChapter[]> = {
  Mathematics: [
    {
      id: 'math-1',
      chapterNumber: 1,
      title: 'Real Numbers & Polynomials',
      topics: ['Euclid Division Lemma', 'Fundamental Theorem of Arithmetic', 'Zeroes of a Polynomial'],
      completed: true,
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      id: 'math-2',
      chapterNumber: 2,
      title: 'Pair of Linear Equations in Two Variables',
      topics: ['Graphical Method', 'Algebraic Method: Substitution & Elimination', 'Equations Reducible to Linear Form'],
      completed: true,
    },
    {
      id: 'math-3',
      chapterNumber: 3,
      title: 'Quadratic Equations',
      topics: ['Standard Form', 'Factorisation Method', 'Nature of Roots & Discriminant'],
      completed: false,
    },
    {
      id: 'math-4',
      chapterNumber: 4,
      title: 'Arithmetic Progressions',
      topics: ['nth Term of an AP', 'Sum of First n Terms of an AP'],
      completed: false,
    },
  ],
  Science: [
    {
      id: 'sci-1',
      chapterNumber: 1,
      title: 'Chemical Reactions and Equations',
      topics: ['Chemical Equations', 'Types of Chemical Reactions', 'Corrosion and Rancidity'],
      completed: true,
    },
    {
      id: 'sci-2',
      chapterNumber: 2,
      title: 'Acids, Bases and Salts',
      topics: ['Chemical Properties', 'pH Scale Concept', 'Salts & Derivatives'],
      completed: false,
    },
    {
      id: 'sci-3',
      chapterNumber: 3,
      title: 'Life Processes',
      topics: ['Nutrition in Autotrophs & Heterotrophs', 'Respiration & Circulation', 'Excretion in Humans'],
      completed: false,
    },
  ],
  English: [
    {
      id: 'eng-1',
      chapterNumber: 1,
      title: 'A Letter to God',
      topics: ['Reading Comprehension', 'Character Sketch of Lencho', 'Grammar: Tenses & Reported Speech'],
      completed: true,
    },
    {
      id: 'eng-2',
      chapterNumber: 2,
      title: 'Nelson Mandela: Long Walk to Freedom',
      topics: ['Autobiography Analysis', 'Theme & Vocabulary', 'Analytical Paragraph Writing'],
      completed: true,
    },
  ],
};

const SUBJECT_OPTIONS = [
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Science', value: 'Science' },
  { label: 'English', value: 'English' },
];

export default function StudentSyllabusScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');

  const chapters = SUBJECT_SYLLABUS[selectedSubject] || [];
  const completedCount = chapters.filter((c) => c.completed).length;
  const progressPercent = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  return (
    <Screen>
      <View style={styles.headerWrap}>
        <ThemedText type="subtitle">{t('syllabus')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Chapter-wise topic breakdown and completion status
        </ThemedText>
      </View>

      <SelectField
        label={t('select_subject')}
        options={SUBJECT_OPTIONS}
        value={selectedSubject}
        onChange={(val) => setSelectedSubject(val)}
      />

      {/* Progress Bar Card */}
      <Card style={styles.progressCard}>
        <View style={styles.progressTop}>
          <ThemedText type="smallBold">{selectedSubject} Progress</ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            {progressPercent}% Completed
          </ThemedText>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
          <View style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: theme.tint }]} />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
          {completedCount} of {chapters.length} Chapters Covered
        </ThemedText>
      </Card>

      {/* Chapter List */}
      {chapters.length === 0 ? (
        <EmptyState message="No syllabus available for this subject." icon="book-outline" />
      ) : (
        chapters.map((ch) => (
          <Card key={ch.id} style={styles.chapterCard}>
            <View style={styles.chapterHeader}>
              <View style={styles.chTitleCol}>
                <View style={[styles.badge, { backgroundColor: theme.dark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
                  <ThemedText type="smallBold" style={{ color: theme.tint, fontSize: 11 }}>
                    CH {ch.chapterNumber}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.chTitle}>
                  {ch.title}
                </ThemedText>
              </View>

              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: ch.completed ? (theme.dark ? 'rgba(34,197,94,0.2)' : '#DCFCE7') : (theme.dark ? 'rgba(234,179,8,0.2)' : '#FEF3C7') },
                ]}
              >
                <Ionicons
                  name={ch.completed ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={ch.completed ? '#16A34A' : '#D97706'}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: ch.completed ? (theme.dark ? '#86EFAC' : '#15803D') : (theme.dark ? '#FDE047' : '#B45309'),
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {ch.completed ? 'Completed' : 'In Progress'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.topicsList}>
              {ch.topics.map((topic, i) => (
                <View key={i} style={styles.topicRow}>
                  <Ionicons name="ellipse" size={6} color={theme.textSecondary} style={{ marginTop: 6 }} />
                  <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                    {topic}
                  </ThemedText>
                </View>
              ))}
            </View>

            {ch.pdfUrl ? (
              <Pressable
                onPress={() => Linking.openURL(ch.pdfUrl!)}
                style={({ pressed }) => [styles.attachBtn, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="document-text-outline" size={16} color={theme.tint} />
                <ThemedText type="smallBold" style={{ color: theme.tint, fontSize: 12 }}>
                  Download Syllabus PDF
                </ThemedText>
              </Pressable>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: Spacing.three,
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
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
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
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  chTitle: {
    flex: 1,
    fontSize: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  topicsList: {
    gap: 6,
    paddingLeft: Spacing.two,
    marginBottom: Spacing.two,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
});
