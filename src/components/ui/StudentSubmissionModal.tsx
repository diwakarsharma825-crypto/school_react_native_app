import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

interface StudentSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  subject: string;
  submission: {
    studentName?: string;
    studentSrn?: string;
    submittedAt?: string;
    description?: string | null;
    photos?: string[];
    status?: string | null;
    rating?: string | null;
    teacherRemarks?: string | null;
    signatureUrl?: string | null;
  } | null;
}

export function StudentSubmissionModal({
  visible,
  onClose,
  subject,
  submission,
}: StudentSubmissionModalProps) {
  const theme = useTheme();
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  if (!submission) return null;

  const isReviewed = submission.status === 'reviewed';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header Banner */}
          <View style={[styles.headerBanner, { backgroundColor: theme.tint }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', lineHeight: 20 }}>
                My Submission — {subject}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, lineHeight: 16 }}>
                {submission.submittedAt ? `Submitted on ${submission.submittedAt}` : 'Homework Submission Details'}
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 12 }}>
              {/* Status Badge */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: Radius.md,
                  backgroundColor: isReviewed ? (theme.dark ? '#064E3B' : '#ECFDF5') : (theme.dark ? '#451A03' : '#FEF3C7'),
                  borderWidth: 1,
                  borderColor: isReviewed ? (theme.dark ? '#059669' : '#A7F3D0') : (theme.dark ? '#D97706' : '#FDE68A'),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={isReviewed ? 'checkmark-circle' : 'time'}
                    size={20}
                    color={isReviewed ? '#10B981' : '#F59E0B'}
                  />
                  <Text
                    style={{
                      fontWeight: '700',
                      fontSize: 13,
                      color: isReviewed ? (theme.dark ? '#A7F3D0' : '#065F46') : (theme.dark ? '#FDE68A' : '#92400E'),
                    }}
                  >
                    {isReviewed ? '✓ Reviewed by Teacher' : '⏳ Pending Review'}
                  </Text>
                </View>

                {submission.rating ? (
                  <View
                    style={{
                      backgroundColor: '#FEFCBF',
                      borderColor: '#D69E2E',
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: '#744210', fontWeight: '700', fontSize: 11 }}>
                      🌟 Grade: {submission.rating}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Student Note */}
              <View>
                <ThemedText type="caption" style={[styles.label, { color: theme.tint }]}>
                  MY SUBMISSION NOTE:
                </ThemedText>
                <View
                  style={[
                    styles.sectionBox,
                    { backgroundColor: theme.dark ? '#1E242D' : '#F8FAFC', borderColor: theme.border },
                  ]}
                >
                  <Text style={{ fontSize: 13, color: theme.text, lineHeight: 20 }}>
                    {submission.description || 'No note added.'}
                  </Text>
                </View>
              </View>

              {/* Submitted Photos */}
              {submission.photos && submission.photos.length > 0 ? (
                <View>
                  <ThemedText type="caption" style={[styles.label, { color: theme.tint }]}>
                    MY ATTACHED PHOTOS ({submission.photos.length}) — TAP TO EXPAND:
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

              {/* Teacher Remarks & Digital Signature */}
              {isReviewed || submission.teacherRemarks || submission.signatureUrl ? (
                <View>
                  <ThemedText type="caption" style={[styles.label, { color: theme.tint }]}>
                    TEACHER FEEDBACK &amp; REMARKS:
                  </ThemedText>
                  <View
                    style={{
                      padding: 14,
                      borderRadius: Radius.md,
                      backgroundColor: theme.dark ? '#064E3B' : '#F0FDF4',
                      borderWidth: 1,
                      borderColor: theme.dark ? '#059669' : '#BBF7D0',
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: theme.dark ? '#ECFDF5' : '#15803D', fontWeight: '600', lineHeight: 20 }}>
                      💬 {submission.teacherRemarks || 'No remarks provided.'}
                    </Text>

                    {submission.signatureUrl ? (
                      <View
                        style={{
                          marginTop: 12,
                          alignItems: 'flex-end',
                          paddingTop: 10,
                          borderTopWidth: 1,
                          borderTopColor: 'rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <Text style={{ fontSize: 11, color: theme.dark ? '#A7F3D0' : '#15803D', fontWeight: '700', marginBottom: 4 }}>
                          ✓ Signed by Teacher:
                        </Text>
                        <Image source={{ uri: submission.signatureUrl }} style={{ width: 120, height: 44 }} contentFit="contain" />
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnClose,
                  { backgroundColor: theme.tint },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onClose}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Close</Text>
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
    maxWidth: 500,
    maxHeight: '88%',
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
    marginBottom: 4,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  footer: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  btnClose: {
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
