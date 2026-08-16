import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FullScreenGallery } from './FullScreenGallery';
import { ThemedText } from './ThemedText';

interface NoticeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  date: string;
  notice: string;
  statusLabel?: string;
  isActiveStatus?: boolean;
  imageUrl?: string | null;
  onEdit?: () => void;
}

export function NoticeDetailModal({
  visible,
  onClose,
  title,
  date,
  notice,
  statusLabel,
  isActiveStatus = true,
  imageUrl,
  onEdit,
}: NoticeDetailModalProps) {
  const theme = useTheme();
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropOverlay} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <ThemedText type="subtitle" style={styles.title}>
                {title}
              </ThemedText>
              <View style={styles.metaRow}>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {date}
                  </ThemedText>
                </View>

                {statusLabel ? (
                  <View
                    style={[
                      styles.statusTag,
                      {
                        backgroundColor: isActiveStatus
                          ? theme.dark
                            ? 'rgba(34, 197, 94, 0.2)'
                            : '#DCFCE7'
                          : theme.dark
                          ? 'rgba(234, 179, 8, 0.2)'
                          : '#FEF3C7',
                      },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{
                        fontSize: 11,
                        color: isActiveStatus
                          ? theme.dark
                            ? '#86EFAC'
                            : '#15803D'
                          : theme.dark
                          ? '#FDE047'
                          : '#B45309',
                      }}
                    >
                      {statusLabel}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={true} style={styles.bodyScroll}>
            {imageUrl ? (
              <Pressable onPress={() => setGalleryOpen(true)} style={styles.imageWrap}>
                <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
                <View style={styles.zoomHint}>
                  <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 11 }}>
                    Tap to expand
                  </ThemedText>
                </View>
              </Pressable>
            ) : null}

            <View style={[styles.contentCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <ThemedText type="default" style={styles.bodyText}>
                {notice}
              </ThemedText>
            </View>
          </ScrollView>

          {onEdit ? (
            <View style={styles.footerRow}>
              <Pressable
                onPress={() => {
                  onClose();
                  onEdit();
                }}
                style={[styles.editButton, { backgroundColor: theme.dark ? '#2563EB' : theme.tint }]}
              >
                <Ionicons name="pencil" size={16} color="#FFFFFF" />
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  Edit Notice
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {imageUrl && galleryOpen ? (
        <FullScreenGallery
          visible={galleryOpen}
          photoUrls={[imageUrl]}
          initialIndex={0}
          onClose={() => setGalleryOpen(false)}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
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
  headerTitleWrap: {
    flex: 1,
    marginRight: Spacing.two,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  closeBtn: {
    padding: 4,
  },
  bodyScroll: {
    marginBottom: Spacing.two,
  },
  imageWrap: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  contentCard: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  footerRow: {
    marginTop: Spacing.two,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
  },
});
