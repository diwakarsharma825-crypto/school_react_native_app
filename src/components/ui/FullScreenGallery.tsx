import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';

interface FullScreenGalleryProps {
  visible: boolean;
  photoUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Full-screen swipeable photo viewer — tap a thumbnail in the homework
 * detail modal to open here, swipe left/right between attachments. */
export function FullScreenGallery({ visible, photoUrls, initialIndex, onClose }: FullScreenGalleryProps) {
  const [index, setIndex] = useState(initialIndex);
  const [downloading, setDownloading] = useState(false);
  const listRef = useRef<FlatList<string>>(null);

  async function handleDownload() {
    const uri = photoUrls[index];
    if (!uri || downloading) return;
    setDownloading(true);
    try {
      const file = await FileSystem.File.downloadFileAsync(uri, new FileSystem.Directory(FileSystem.Paths.cache), {
        idempotent: true,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, { dialogTitle: 'Save Photo' });
      } else {
        Alert.alert('Downloaded', `Saved to ${file.uri}`);
      }
    } catch (e) {
      Alert.alert('Could not download', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Pressable onPress={handleDownload} hitSlop={12} style={styles.downloadButton} disabled={downloading}>
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={26} color="#fff" />
          )}
        </Pressable>
        {photoUrls.length > 1 ? (
          <View style={styles.counter}>
            <ThemedText type="small" style={styles.counterText}>
              {index + 1} / {photoUrls.length}
            </ThemedText>
          </View>
        ) : null}
        <FlatList
          ref={listRef}
          data={photoUrls}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <View style={styles.page}>
              <Image source={{ uri: item }} style={styles.photo} contentFit="contain" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.four,
    zIndex: 10,
    padding: Spacing.two,
  },
  downloadButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.four,
    zIndex: 10,
    padding: Spacing.two,
  },
  counter: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    zIndex: 10,
  },
  counterText: {
    color: '#fff',
  },
  page: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
