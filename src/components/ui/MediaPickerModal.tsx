import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

export interface SelectedMediaFile {
  uri: string;
  mimeType: string | null;
  name: string;
}

interface MediaPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMedia: (file: SelectedMediaFile) => void;
  title?: string;
  allowDocument?: boolean;
  allowVideo?: boolean;
}

const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB limit

export function MediaPickerModal({
  visible,
  onClose,
  onSelectMedia,
  title = 'Select Media Source',
  allowDocument = true,
  allowVideo = false,
}: MediaPickerModalProps) {
  const theme = useTheme();

  async function handleCameraPhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Camera access is required to capture photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const filename = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
      onSelectMedia({ uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg', name: filename });
      onClose();
    } catch (e) {
      Alert.alert('Camera Error', e instanceof Error ? e.message : 'Could not open camera.');
    }
  }

  async function handleCameraVideo() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Camera access is required to record videos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 60,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      let size = asset.fileSize;
      if (!size) {
        try {
          const info = await FileSystem.getInfoAsync(asset.uri);
          if (info.exists && info.size) {
            size = info.size;
          }
        } catch {}
      }

      if (size && size > MAX_VIDEO_SIZE_BYTES) {
        Alert.alert(
          'Video Size Limit Exceeded',
          'The recorded video exceeds the 20 MB size limit. Please record a shorter video.'
        );
        return;
      }

      const filename = asset.fileName || asset.uri.split('/').pop() || 'video.mp4';
      onSelectMedia({ uri: asset.uri, mimeType: asset.mimeType || 'video/mp4', name: filename });
      onClose();
    } catch (e) {
      Alert.alert('Camera Error', e instanceof Error ? e.message : 'Could not open video camera.');
    }
  }

  async function handleGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: allowVideo ? ['images', 'videos'] : ['images'],
        quality: 0.7,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
      if (isVideo) {
        let size = asset.fileSize;
        if (!size) {
          try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            if (info.exists && info.size) {
              size = info.size;
            }
          } catch {}
        }
        if (size && size > MAX_VIDEO_SIZE_BYTES) {
          Alert.alert(
            'Video Size Limit Exceeded',
            'Selected video exceeds the 20 MB size limit. Please select a smaller video.'
          );
          return;
        }
      }

      const filename = asset.fileName || asset.uri.split('/').pop() || (isVideo ? 'video.mp4' : 'media.jpg');
      const defaultMime = isVideo ? 'video/mp4' : 'image/jpeg';
      onSelectMedia({ uri: asset.uri, mimeType: asset.mimeType || defaultMime, name: filename });
      onClose();
    } catch (e) {
      Alert.alert('Gallery Error', e instanceof Error ? e.message : 'Could not select media.');
    }
  }

  async function handleDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      onSelectMedia({ uri: asset.uri, mimeType: asset.mimeType || 'application/pdf', name: asset.name });
      onClose();
    } catch (e) {
      Alert.alert('Document Error', e instanceof Error ? e.message : 'Could not select document.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.optionsGrid}>
            <Pressable
              onPress={handleCameraPhoto}
              style={[styles.optionCard, { backgroundColor: theme.dark ? 'rgba(56, 189, 248, 0.12)' : '#EFF6FF', borderColor: theme.border }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.tint }]}>
                <Ionicons name="camera" size={24} color="#FFF" />
              </View>
              <ThemedText type="smallBold" style={styles.optionTitle}>
                Take Photo
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.optionDesc}>
                Open Camera
              </ThemedText>
            </Pressable>

            {allowVideo ? (
              <Pressable
                onPress={handleCameraVideo}
                style={[styles.optionCard, { backgroundColor: theme.dark ? 'rgba(168, 85, 247, 0.12)' : '#F3E8FF', borderColor: theme.border }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#9333EA' }]}>
                  <Ionicons name="videocam" size={24} color="#FFF" />
                </View>
                <ThemedText type="smallBold" style={styles.optionTitle}>
                  Record Video
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.optionDesc}>
                  Max 20 MB
                </ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleGallery}
              style={[styles.optionCard, { backgroundColor: theme.dark ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4', borderColor: theme.border }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#16A34A' }]}>
                <Ionicons name="images" size={24} color="#FFF" />
              </View>
              <ThemedText type="smallBold" style={styles.optionTitle}>
                Gallery
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.optionDesc}>
                {allowVideo ? 'Photos & Videos' : 'Photos'}
              </ThemedText>
            </Pressable>

            {allowDocument ? (
              <Pressable
                onPress={handleDocument}
                style={[styles.optionCard, { backgroundColor: theme.dark ? 'rgba(249, 115, 22, 0.12)' : '#FFF7ED', borderColor: theme.border }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#EA580C' }]}>
                  <Ionicons name="document-text" size={24} color="#FFF" />
                </View>
                <ThemedText type="smallBold" style={styles.optionTitle}>
                  Document
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.optionDesc}>
                  PDF / File
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
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
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  optionTitle: {
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 11,
  },
});
