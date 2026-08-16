import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { EventMediaItem } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { EventMediaCarousel } from './EventMediaCarousel';
import { FullScreenGallery } from './FullScreenGallery';
import { ThemedText } from './ThemedText';

interface EventDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  eventFrom: string;
  eventTo?: string | null;
  eventPlace?: string | null;
  classLabel?: string | null;
  note?: string | null;
  media?: EventMediaItem[];
  imageUrl?: string | null;
  statusLabel?: string;
  isActiveStatus?: boolean;
  onEdit?: () => void;
}

export function EventDetailModal({
  visible,
  onClose,
  title,
  eventFrom,
  eventTo,
  eventPlace,
  classLabel,
  note,
  media,
  imageUrl,
  statusLabel,
  isActiveStatus = true,
  onEdit,
}: EventDetailModalProps) {
  const theme = useTheme();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const images = (media ?? []).filter((m) => m.type === 'image').map((m) => m.url);
  const displayImages = images.length > 0 ? images : imageUrl ? [imageUrl] : [];

  const dateStr = eventTo && eventTo !== eventFrom ? `${eventFrom} — ${eventTo}` : eventFrom;

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

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={true} style={styles.bodyScroll}>
            {displayImages.length > 0 || (media && media.length > 0) ? (
              <View style={styles.heroWrap}>
                <EventMediaCarousel
                  coverMedia={media && media.length > 0 ? media[0] : null}
                  images={displayImages}
                  fallbackUrl={imageUrl ?? undefined}
                  style={styles.heroCarousel}
                />
              </View>
            ) : null}

            <View style={styles.metaRowWrap}>
              <View style={styles.metaBadge}>
                <Ionicons name="calendar-outline" size={15} color={theme.dark ? '#60A5FA' : theme.tint} />
                <ThemedText type="smallBold">{dateStr}</ThemedText>
              </View>

              {eventPlace ? (
                <View style={styles.metaBadge}>
                  <Ionicons name="location-outline" size={15} color={theme.dark ? '#60A5FA' : theme.tint} />
                  <ThemedText type="smallBold">{eventPlace}</ThemedText>
                </View>
              ) : null}

              {classLabel ? (
                <View style={styles.metaBadge}>
                  <Ionicons name="school-outline" size={15} color={theme.dark ? '#60A5FA' : theme.tint} />
                  <ThemedText type="smallBold">{classLabel}</ThemedText>
                </View>
              ) : null}
            </View>

            {note ? (
              <View style={[styles.contentCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="smallBold" style={{ marginBottom: Spacing.one }}>
                  Event Details & Note
                </ThemedText>
                <ThemedText type="default" style={styles.bodyText}>
                  {note}
                </ThemedText>
              </View>
            ) : null}
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
                  Edit Event
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {galleryOpen && displayImages.length > 0 ? (
        <FullScreenGallery
          visible={galleryOpen}
          photoUrls={displayImages}
          initialIndex={galleryIndex}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: Spacing.two,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
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
  heroWrap: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  heroCarousel: {
    height: 220,
  },
  metaRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  contentCard: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  bodyText: {
    fontSize: 14,
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
