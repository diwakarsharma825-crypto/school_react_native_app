import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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
    teacherName?: string | null;
    teacherPhoto?: string | null;
  } | null;
}

export function StudentSubmissionModal({
  visible,
  onClose,
  subject,
  submission,
}: StudentSubmissionModalProps) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  if (!submission) return null;

  const isReviewed = submission.status === 'reviewed';
  const cardHeight = Math.min(680, Math.max(380, windowHeight * 0.85));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { height: cardHeight, backgroundColor: theme.dark ? '#0F172A' : '#FFFFFF', borderColor: theme.dark ? '#334155' : theme.border }]}>
          {/* Top Header Banner */}
          <View style={[styles.headerBanner, { backgroundColor: theme.dark ? '#1E293B' : '#1E40AF' }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="document-text" size={20} color="#60A5FA" />
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }} numberOfLines={1}>
                  My Submission — {subject}
                </Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
                {submission.submittedAt ? `Submitted on ${submission.submittedAt}` : 'Homework Submission Details'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeIconBtn,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 18, paddingVertical: 16, flex: 1 }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingBottom: 16 }}>
              {/* Teacher Review Status Badge */}
              <View
                style={{
                  padding: 14,
                  borderRadius: Radius.lg,
                  backgroundColor: isReviewed ? (theme.dark ? 'rgba(6, 78, 59, 0.4)' : '#ECFDF5') : (theme.dark ? 'rgba(69, 26, 3, 0.4)' : '#FEF3C7'),
                  borderWidth: 1.5,
                  borderColor: isReviewed ? (theme.dark ? '#059669' : '#A7F3D0') : (theme.dark ? '#D97706' : '#FDE68A'),
                  shadowColor: isReviewed ? '#10B981' : '#F59E0B',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isReviewed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={isReviewed ? 'checkmark-circle' : 'time'}
                        size={20}
                        color={isReviewed ? '#10B981' : '#F59E0B'}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontWeight: '800',
                          fontSize: 14,
                          color: isReviewed ? (theme.dark ? '#A7F3D0' : '#065F46') : (theme.dark ? '#FDE68A' : '#92400E'),
                        }}
                      >
                        {isReviewed ? 'Teacher Review & Grade' : 'Pending Review'}
                      </Text>
                      <Text style={{ fontSize: 11, color: isReviewed ? (theme.dark ? '#6EE7B7' : '#047857') : (theme.dark ? '#FCD34D' : '#B45309'), marginTop: 1 }}>
                        {isReviewed ? 'Teacher has reviewed your submission' : 'Awaiting teacher feedback'}
                      </Text>
                    </View>
                  </View>

                  {submission.rating ? (
                    <View
                      style={{
                        backgroundColor: '#FEFCBF',
                        borderColor: '#D69E2E',
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: Radius.pill,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                      }}
                    >
                      <Text style={{ color: '#744210', fontWeight: '800', fontSize: 12 }}>
                        🌟 Grade: {submission.rating}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Student Note */}
              <View>
                <Text style={[styles.sectionLabel, { color: theme.dark ? '#60A5FA' : '#1D4ED8' }]}>
                  MY SUBMISSION NOTE:
                </Text>
                <View
                  style={[
                    styles.sectionBox,
                    {
                      backgroundColor: theme.dark ? '#1E293B' : '#F8FAFC',
                      borderColor: theme.dark ? '#334155' : theme.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13, color: theme.dark ? '#E2E8F0' : theme.text, lineHeight: 20 }}>
                    {submission.description || 'No note added.'}
                  </Text>
                </View>
              </View>

              {/* Submitted Photos */}
              {submission.photos && submission.photos.length > 0 ? (
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.dark ? '#60A5FA' : '#1D4ED8' }]}>
                    MY ATTACHED PHOTOS ({submission.photos.length}) — TAP TO EXPAND:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 6, paddingBottom: 4 }}>
                    {submission.photos.map((p, i) => (
                      <Pressable key={i} onPress={() => setPreviewPhoto(p)} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                        <Image source={{ uri: p }} style={[styles.submissionPhoto, { borderColor: theme.dark ? '#334155' : theme.border }]} contentFit="cover" />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* Teacher Remarks & Digital Signature Card */}
              {isReviewed || submission.teacherRemarks || submission.signatureUrl ? (
                <View>
                  <Text style={[styles.sectionLabel, { color: theme.dark ? '#60A5FA' : '#1D4ED8' }]}>
                    TEACHER FEEDBACK &amp; REMARKS:
                  </Text>
                  <View
                    style={{
                      padding: 16,
                      borderRadius: Radius.lg,
                      backgroundColor: theme.dark ? 'rgba(6, 78, 59, 0.4)' : '#F0FDF4',
                      borderWidth: 1.5,
                      borderColor: theme.dark ? '#059669' : '#BBF7D0',
                      marginTop: 4,
                    }}
                  >
                    {/* Teacher Profile Info Row */}
                    {submission.teacherName ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.dark ? 'rgba(5, 150, 105, 0.3)' : 'rgba(187, 247, 208, 0.8)' }}>
                        {submission.teacherPhoto ? (
                          <Image source={{ uri: submission.teacherPhoto }} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#10B981' }} contentFit="cover" />
                        ) : (
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.dark ? '#047857' : '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="person" size={14} color={theme.dark ? '#A7F3D0' : '#15803D'} />
                          </View>
                        )}
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.dark ? '#ECFDF5' : '#14532D' }}>
                            {submission.teacherName}
                          </Text>
                          <Text style={{ fontSize: 10, color: theme.dark ? '#6EE7B7' : '#166534' }}>
                            Class Teacher / Reviewer
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      <Ionicons name="chatbox-ellipses" size={18} color={theme.dark ? '#34D399' : '#15803D'} style={{ marginTop: 1 }} />
                      <Text style={{ flex: 1, fontSize: 14, color: theme.dark ? '#ECFDF5' : '#15803D', fontWeight: '600', lineHeight: 21 }}>
                        {submission.teacherRemarks || 'No remarks provided.'}
                      </Text>
                    </View>

                    {/* Teacher Signature Card - White Background for Maximum Ink Legibility */}
                    {submission.signatureUrl ? (
                      <View
                        style={{
                          marginTop: 14,
                          padding: 12,
                          borderRadius: Radius.md,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 3,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {submission.teacherPhoto ? (
                            <Image source={{ uri: submission.teacherPhoto }} style={{ width: 24, height: 24, borderRadius: 12 }} contentFit="cover" />
                          ) : (
                            <Ionicons name="ribbon" size={18} color="#059669" />
                          )}
                          <View>
                            <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '800' }}>
                              {submission.teacherName ? `Signed by ${submission.teacherName}` : 'Signed by Teacher'}
                            </Text>
                            <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                              Verified Digital Signature
                            </Text>
                          </View>
                        </View>
                        <Image source={{ uri: submission.signatureUrl }} style={{ width: 110, height: 42 }} contentFit="contain" />
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.footer, { borderTopColor: theme.dark ? '#334155' : theme.border }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnClose,
                  { backgroundColor: theme.dark ? '#2563EB' : theme.tint },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={onClose}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Full-Screen Image Preview Modal */}
        {previewPhoto ? (
          <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
            <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
              <Pressable style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }} onPress={() => setPreviewPhoto(null)}>
                <Ionicons name="close-circle" size={38} color="#FFFFFF" />
              </Pressable>
              <Image source={{ uri: previewPhoto }} style={{ width: '100%', height: Math.min(600, windowHeight * 0.8) }} contentFit="contain" />
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
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
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
    width: '94%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontWeight: '800',
    marginBottom: 6,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  sectionBox: {
    padding: 14,
    borderRadius: Radius.md,
    marginTop: 2,
    borderWidth: 1,
  },
  submissionPhoto: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  footer: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  btnClose: {
    paddingVertical: 13,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
