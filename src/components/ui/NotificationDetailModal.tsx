import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FullScreenGallery } from './FullScreenGallery';
import { ThemedText } from './ThemedText';

interface NotificationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  date: string;
  body: string;
  imageUrl?: string | null;
}

/** Full-detail view for a single notification, opened by tapping its card —
 * mirrors HomeworkDetailModal so the whole app views "list item -> full
 * detail" the same way. Tapping the image opens it full-screen. */
export function NotificationDetailModal({ visible, onClose, title, date, body, imageUrl }: NotificationDetailModalProps) {
  const theme = useTheme();
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="title">{title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {date}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {imageUrl ? (
              <Pressable onPress={() => setGalleryOpen(true)}>
                <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
              </Pressable>
            ) : null}
            <ThemedText type="default" style={styles.text}>
              {body}
            </ThemedText>
          </ScrollView>
        </View>
      </View>

      {imageUrl ? (
        <FullScreenGallery visible={galleryOpen} photoUrls={[imageUrl]} initialIndex={0} onClose={() => setGalleryOpen(false)} />
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
  body: {
    marginBottom: Spacing.two,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    marginBottom: Spacing.three,
  },
  text: {
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
});
