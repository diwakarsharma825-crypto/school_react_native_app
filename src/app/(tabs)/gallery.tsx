import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchGallery } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { GalleryImage } from '@/data/types';

const COLUMNS = 3;
const GAP = Spacing.two;

export default function GalleryScreen() {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth, 720) - Spacing.three * 2;
  const tileSize = (contentWidth - GAP * (COLUMNS - 1)) / COLUMNS;
  const { data, loading, error, refetch } = useFetch(fetchGallery);
  const [selected, setSelected] = useState<GalleryImage | null>(null);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading gallery…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load gallery." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <View style={styles.grid}>
          {data.map((img) => (
            <Pressable key={img.id} onPress={() => setSelected(img)}>
              <Image
                source={{ uri: img.imageUrl }}
                style={[styles.tile, { width: tileSize, height: tileSize }]}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState message="No photos yet." icon="images-outline" />
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.closeButton} onPress={() => setSelected(null)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {selected ? (
            <>
              <Image source={{ uri: selected.imageUrl }} style={styles.fullImage} contentFit="contain" />
              {selected.caption ? (
                <ThemedText type="default" style={styles.caption}>
                  {selected.caption}
                </ThemedText>
              ) : null}
            </>
          ) : null}
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
  caption: {
    color: '#fff',
    marginTop: Spacing.two,
  },
});
