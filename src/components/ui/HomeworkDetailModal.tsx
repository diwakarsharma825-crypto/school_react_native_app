import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FullScreenGallery } from './FullScreenGallery';
import { ThemedText } from './ThemedText';

// A percentage width ('48%') can resolve to 0 for a ScrollView's direct
// children in some layout passes, silently collapsing the photo grid — use
// a pixel size computed from the screen instead.
const SHEET_PADDING = Spacing.four * 2;
const PHOTO_GAP = Spacing.two;
const PHOTO_SIZE = (Dimensions.get('window').width - SHEET_PADDING - PHOTO_GAP) / 2;

interface HomeworkDetailModalProps {
  visible: boolean;
  onClose: () => void;
  subject: string;
  chapter?: string | null;
  date: string;
  description: string | null;
  photoUrls: string[];
  teacherName?: string | null;
  teacherPhoto?: string | null;
}

/** Full-detail view for one homework entry — subject, date, complete
 * description text, and every attached photo at a readable size, opened by
 * tapping an entry in either the teacher or student calendar list. */
export function HomeworkDetailModal({ visible, onClose, subject, chapter, date, description, photoUrls, teacherName, teacherPhoto }: HomeworkDetailModalProps) {
  const theme = useTheme();
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <View style={styles.badgeRow}>
                <ThemedText type="title">{subject}</ThemedText>
                {chapter ? (
                  <View
                    style={[
                      styles.chapterBadge,
                      {
                        backgroundColor: theme.dark ? 'rgba(59, 130, 246, 0.25)' : '#EFF6FF',
                        borderColor: theme.dark ? '#3B82F6' : '#BFDBFE',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.dark ? '#93C5FD' : '#1D4ED8', fontSize: 12 }}>
                      {chapter ? chapter.replace(/^Ch\s*\d+\s*:\s*(Ch\s*[-:\s]?\d+.*|Chapter\s*[-:\s]?\d+.*)$/i, '$1') : ''}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {date}
              </ThemedText>
              {teacherName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {teacherPhoto ? (
                    <Image source={{ uri: teacherPhoto }} style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: theme.border }} contentFit="cover" />
                  ) : (
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.dark ? '#334155' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={11} color={theme.dark ? '#94A3B8' : '#64748B'} />
                    </View>
                  )}
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '600' }}>
                    Assigned by {teacherName}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {description ? (
              <ThemedText type="default" style={styles.description}>
                {description}
              </ThemedText>
            ) : (
              <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
                No description added.
              </ThemedText>
            )}

            {photoUrls.length > 0 ? (
              <>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.photosLabel}>
                  ATTACHMENTS
                </ThemedText>
                <View style={styles.photoGrid}>
                  {photoUrls.map((uri, i) => (
                    <Pressable key={i} onPress={() => setGalleryIndex(i)}>
                      <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>

      {galleryIndex !== null ? (
        <FullScreenGallery
          visible
          photoUrls={photoUrls}
          initialIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
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
  chapterBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  body: {
    marginBottom: Spacing.two,
  },
  description: {
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  photosLabel: {
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: Radius.sm,
  },
});
