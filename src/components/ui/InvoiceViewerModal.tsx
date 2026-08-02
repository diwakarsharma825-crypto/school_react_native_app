import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';

interface InvoiceViewerModalProps {
  visible: boolean;
  onClose: () => void;
  url: string | null;
  fileType: 'image' | 'pdf' | null;
}

/** In-app viewer for a fee invoice attachment — used by both the teacher
 * and student Fees screens so tapping "View invoice" never bounces out to
 * an external browser. Images render directly; PDFs render inside a WebView
 * (modern Android/iOS system webviews render a PDF url natively, same as
 * Chrome/Safari's built-in viewer — no external PDF library needed). */
export function InvoiceViewerModal({ visible, onClose, url, fileType }: InvoiceViewerModalProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!url || downloading) return;
    setDownloading(true);
    try {
      const file = await FileSystem.File.downloadFileAsync(url, new FileSystem.Directory(FileSystem.Paths.cache), {
        idempotent: true,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, { dialogTitle: 'Save Invoice' });
      } else {
        Alert.alert('Downloaded', `Saved to ${file.uri}`);
      }
    } catch (e) {
      Alert.alert('Could not download', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  if (!url) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Pressable onPress={handleDownload} hitSlop={12} style={styles.downloadButton} disabled={downloading}>
          {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="download-outline" size={26} color="#fff" />}
        </Pressable>

        {fileType === 'pdf' ? (
          <WebView source={{ uri: url }} style={styles.webview} originWhitelist={['*']} />
        ) : (
          <View style={styles.imageWrap}>
            <Image source={{ uri: url }} style={styles.image} contentFit="contain" />
          </View>
        )}

        <ThemedText type="small" style={styles.hint}>
          {fileType === 'pdf' ? 'PDF' : 'Image'}
        </ThemedText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
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
  webview: {
    flex: 1,
    marginTop: 100,
    backgroundColor: 'transparent',
  },
  imageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.6)',
  },
});
