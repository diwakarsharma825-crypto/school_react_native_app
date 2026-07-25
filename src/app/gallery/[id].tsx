import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { fetchGalleryImages } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { GalleryImage } from '@/data/types';

const COLUMNS = 3;
const GAP = Spacing.two;

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetcher = useCallback(() => fetchGalleryImages(id), [id]);
  const { data, loading, error, refetch } = useFetch(fetcher, [id]);
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth, 720) - Spacing.three * 2;
  const tileSize = (contentWidth - GAP * (COLUMNS - 1)) / COLUMNS;
  const [selected, setSelected] = useState<GalleryImage | null>(null);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading album…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load this album." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <View style={styles.grid}>
          {data.map((img) => (
            <Pressable key={img.id} onPress={() => setSelected(img)}>
              <Image
                source={{ uri: img.image_url }}
                style={[styles.tile, { width: tileSize, height: tileSize }]}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState message="No photos in this album yet." icon="images-outline" />
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.closeButton} onPress={() => setSelected(null)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {selected ? <Image source={{ uri: selected.image_url }} style={styles.fullImage} contentFit="contain" /> : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: Radius.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
