import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MediaPickerModal, SelectedMediaFile } from './MediaPickerModal';
import { ThemedText } from './ThemedText';
import { createFileBlob } from '@/data/teacher-api';
import { submitStudentHomework } from '@/data/homework-api';

interface StudentHomeworkSubmitModalProps {
  visible: boolean;
  onClose: () => void;
  homeworkId: number;
  subject: string;
  studentSrn: string;
  studentName?: string;
  className?: string;
  section?: string;
  initialDescription?: string | null;
  initialPhotos?: string[];
  onSuccess: () => void;
}

const windowWidth = Dimensions.get('window').width;

export function StudentHomeworkSubmitModal({
  visible,
  onClose,
  homeworkId,
  subject,
  studentSrn,
  studentName = '',
  className = '',
  section = '',
  initialDescription = '',
  initialPhotos = [],
  onSuccess,
}: StudentHomeworkSubmitModalProps) {
  const theme = useTheme();
  const [description, setDescription] = useState(initialDescription || '');
  const [photos, setPhotos] = useState<SelectedMediaFile[]>(() => {
    return (initialPhotos || []).map((url, i) => ({
      uri: url,
      name: `Photo_${i + 1}.jpg`,
      mimeType: 'image/jpeg',
    }));
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleAddPhoto(file: SelectedMediaFile) {
    setPhotos((prev) => [...prev, file]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!homeworkId || !studentSrn) {
      Alert.alert('Error', 'Missing homework or student details.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('homework_id', String(homeworkId));
      form.append('srn', studentSrn);
      form.append('student_name', studentName);
      form.append('class', className);
      form.append('section', section);
      form.append('description', description);

      for (let i = 0; i < photos.length; i++) {
        const fileObj = await createFileBlob(photos[i].uri, photos[i].mimeType, photos[i].name);
        form.append('photos[]', fileObj);
      }

      await submitStudentHomework(form);
      Alert.alert('Success 🎉', 'Your homework has been submitted successfully!');
      setDescription('');
      setPhotos([]);
      onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Submission Error', err instanceof Error ? err.message : 'Could not submit homework.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          {/* Top Handle Bar */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <View style={styles.badgeRow}>
                <ThemedText type="title" style={{ fontSize: 18, fontWeight: '700' }}>
                  Submit Homework
                </ThemedText>
                <View style={[styles.subjectBadge, { backgroundColor: theme.tint }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 11 }}>
                    {subject}
                  </ThemedText>
                </View>
              </View>

              {studentName ? (
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                  Student: {studentName} (SRN: {studentSrn})
                </ThemedText>
              ) : null}
            </View>

            <Pressable onPress={onClose} hitSlop={12} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {/* Description / Notes Section */}
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              REMARKS &amp; NOTES
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="Enter details, notes, or answers for your teacher..."
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            {/* Attachments Section */}
            <View style={styles.attachmentHeader}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                ATTACHMENTS ({photos.length})
              </ThemedText>
              <Pressable
                style={[styles.addMediaBtn, { backgroundColor: theme.tint }]}
                onPress={() => setPickerVisible(true)}
              >
                <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 12 }}>
                  Add Photo / File
                </ThemedText>
              </Pressable>
            </View>

            {photos.length > 0 ? (
              <View style={styles.fileList}>
                {photos.map((p, idx) => (
                  <View
                    key={idx}
                    style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <Image source={{ uri: p.uri }} style={styles.fileThumb} contentFit="cover" />
                    <View style={styles.fileMeta}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {p.name}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {p.mimeType?.includes('video') ? 'Video File' : 'Photo Attachment'}
                      </ThemedText>
                    </View>
                    <Pressable onPress={() => handleRemovePhoto(idx)} hitSlop={8} style={styles.removeIconBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="cloud-upload-outline" size={28} color={theme.tint} />
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
                  No photos attached yet. Tap "Add Photo / File" above to take a photo or attach images.
                </ThemedText>
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Action Buttons */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={onClose}
              disabled={submitting}
            >
              <ThemedText type="smallBold" style={{ color: theme.text }}>
                Cancel
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: theme.tint },
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Ionicons name={submitting ? 'sync-outline' : 'paper-plane-outline'} size={16} color="#FFFFFF" />
              <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 14 }}>
                {submitting ? 'Submitting...' : 'Submit Homework'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Media Picker Modal */}
          <MediaPickerModal
            visible={pickerVisible}
            onClose={() => setPickerVisible(false)}
            onSelectMedia={handleAddPhoto}
            title="Attach Homework Media"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerText: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subjectBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginBottom: Spacing.two,
  },
  label: {
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  emptyBox: {
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  fileList: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  fileThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  fileMeta: {
    flex: 1,
    gap: 2,
  },
  removeIconBtn: {
    padding: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
});
