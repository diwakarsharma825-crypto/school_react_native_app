import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';
import { reviewSubmission } from '@/data/teacher-api';

interface TeacherReviewModalProps {
  visible: boolean;
  onClose: () => void;
  submission: {
    id: number;
    student_name?: string | null;
    student_srn?: string | null;
    description?: string | null;
    rating?: string | null;
    teacher_remarks?: string | null;
    signature_url?: string | null;
    photos?: string[];
  } | null;
  teacherToken: string;
  onSuccess: () => void;
}

const RATING_OPTIONS = [
  { label: 'Good 👍', value: 'Good' },
  { label: 'V.Good 🌟', value: 'V.Good' },
  { label: '⭐ 1 Star', value: 'Star' },
  { label: '⭐⭐ 2 Stars', value: '2 Star' },
  { label: '⭐⭐⭐ 3 Stars', value: '3 Star' },
];

export function TeacherReviewModal({
  visible,
  onClose,
  submission,
  teacherToken,
  onSuccess,
}: TeacherReviewModalProps) {
  const theme = useTheme();
  const [rating, setRating] = useState<string>(submission?.rating || 'Good');
  const [remarks, setRemarks] = useState<string>(submission?.teacher_remarks || '');
  const [attachSignature, setAttachSignature] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  async function handleSaveReview() {
    if (!submission?.id) return;
    setSubmitting(true);
    try {
      await reviewSubmission(submission.id, rating, remarks, attachSignature, teacherToken);
      Alert.alert('Success', 'Submission reviewed successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Review Error', err instanceof Error ? err.message : 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!submission) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header Banner */}
          <View style={[styles.headerBanner, { backgroundColor: theme.tint }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', lineHeight: 20 }}>
                Grade &amp; Review — {submission.student_name || submission.student_srn}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, lineHeight: 16 }}>
                Assign grade rating &amp; teacher remarks for SRN {submission.student_srn}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="close-circle" size={26} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 16, paddingVertical: 14, flex: 1 }}>
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 12 }}>
              {/* Student Note */}
              {submission.description ? (
                <View>
                  <ThemedText type="caption" style={styles.label}>
                    STUDENT SUBMISSION NOTE:
                  </ThemedText>
                  <View style={[styles.sectionBox, { backgroundColor: theme.dark ? '#1E242D' : '#F8FAFC', borderColor: theme.border }]}>
                    <ThemedText style={{ fontSize: 13, color: theme.text, lineHeight: 20 }}>
                      {submission.description}
                    </ThemedText>
                  </View>
                </View>
              ) : null}

              {/* Submitted Photos */}
              {submission.photos && submission.photos.length > 0 ? (
                <View>
                  <ThemedText type="caption" style={styles.label}>
                    SUBMITTED PHOTOS ({submission.photos.length}) — TAP TO EXPAND:
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 6, paddingBottom: 4 }}>
                    {submission.photos.map((p, i) => (
                      <Pressable key={i} onPress={() => setPreviewPhoto(p)}>
                        <Image source={{ uri: p }} style={[styles.submissionPhoto, { borderColor: theme.border }]} contentFit="cover" />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* Select Grade / Rating */}
              <View>
                <ThemedText type="caption" style={styles.label}>
                  SELECT GRADE / RATING:
                </ThemedText>
                <View style={[styles.ratingGrid, { marginTop: 4 }]}>
                  {RATING_OPTIONS.map((opt) => {
                    const selected = rating === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[
                          styles.ratingPill,
                          {
                            borderColor: selected ? theme.tint : theme.border,
                            backgroundColor: selected ? (theme.dark ? '#334155' : '#FEFCBF') : (theme.dark ? '#1E242D' : '#F8FAFC'),
                          },
                        ]}
                        onPress={() => setRating(opt.value)}
                      >
                        <ThemedText
                          style={[
                            styles.ratingText,
                            { color: selected ? (theme.dark ? '#F6AD55' : '#744210') : theme.text },
                            selected && { fontWeight: '700' },
                          ]}
                        >
                          {opt.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Teacher Feedback Remarks */}
              <View>
                <ThemedText type="caption" style={styles.label}>
                  TEACHER FEEDBACK REMARKS:
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.dark ? '#1E242D' : '#F8FAFC', marginTop: 4, padding: 12, borderRadius: Radius.md },
                  ]}
                  multiline
                  numberOfLines={3}
                  placeholder="Good effort! Clean handwriting..."
                  placeholderTextColor={theme.textSecondary}
                  value={remarks}
                  onChangeText={setRemarks}
                />
              </View>

              {/* Digital Signature Toggle */}
              <View style={[styles.switchRow, { borderTopColor: theme.border, paddingTop: 12, marginTop: 4 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <ThemedText style={{ fontWeight: '600', fontSize: 13, color: theme.text }}>Attach My Digital Signature</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" style={{ fontSize: 11, marginTop: 2 }}>
                    Appends your official saved signature image to this review.
                  </ThemedText>
                </View>
                <Switch value={attachSignature} onValueChange={setAttachSignature} trackColor={{ true: theme.tint, false: theme.border }} />
              </View>
            </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [
                styles.btnCancel,
                { backgroundColor: theme.dark ? '#334155' : '#E2E8F0', borderColor: theme.border, borderWidth: 1 },
                pressed && { opacity: 0.8 },
              ]}
              onPress={onClose}
            >
              <ThemedText style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btnSubmit,
                { backgroundColor: theme.tint },
                (submitting || pressed) && { opacity: 0.8 },
              ]}
              onPress={handleSaveReview}
              disabled={submitting}
            >
              <ThemedText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                {submitting ? 'Saving...' : '✓ Submit Review'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

        {/* Full-Screen Image Preview Modal */}
        {previewPhoto ? (
          <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
              <Pressable style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }} onPress={() => setPreviewPhoto(null)}>
                <Ionicons name="close-circle" size={36} color="#FFFFFF" />
              </Pressable>
              <Image source={{ uri: previewPhoto }} style={{ width: '100%', height: '80%' }} contentFit="contain" />
            </View>
          </Modal>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          width: '100vw',
          height: '100vh',
        } as any)
      : {}),
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  body: {
    marginVertical: Spacing.xs,
  },
  sectionBox: {
    padding: 12,
    borderRadius: Radius.md,
    marginTop: 4,
    borderWidth: 1,
  },
  submissionPhoto: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  label: {
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  ratingText: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    minHeight: 75,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmit: {
    flex: 1.5,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
