import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HandsFreeCameraScannerModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onScanComplete: (scannedImages: string[]) => void;
}

export function HandsFreeCameraScannerModal({
  visible,
  onClose,
  title = 'Hands-Free Document Scanner',
  subtitle = 'Hold camera steady over book page or notebook. Auto-captures pages hands-free!',
  onScanComplete,
}: HandsFreeCameraScannerModalProps) {
  const theme = useTheme();
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [scanningActive, setScanningActive] = useState(false);
  const [autoTimer, setAutoTimer] = useState(3);
  const [autoScanMessage, setAutoScanMessage] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setScannedPages([]);
      setScanningActive(true);
      setAutoScanMessage('Hold camera over page 1...');
    } else {
      stopAutoScanner();
    }
  }, [visible]);

  function stopAutoScanner() {
    setScanningActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Simulate auto-capture hands-free page scanning
  function triggerAutoCapturePage() {
    if (timerRef.current) clearInterval(timerRef.current);
    setAutoTimer(3);
    setAutoScanMessage('Hold steady... Auto-scanning page');

    let count = 3;
    timerRef.current = setInterval(() => {
      count -= 1;
      setAutoTimer(count);
      if (count <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;

        // Auto-captured sample frame
        const newPageUri = `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80`;
        setScannedPages((prev) => {
          const updated = [...prev, newPageUri];
          setAutoScanMessage(`Page ${updated.length} captured! Turn to page ${updated.length + 1}...`);
          return updated;
        });
        setAutoTimer(3);
      }
    }, 1000);
  }

  async function pickPageFromGallery() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uris = res.assets.map((a) => a.uri);
        setScannedPages((prev) => [...prev, ...uris]);
        setAutoScanMessage(`Added ${res.assets.length} page(s). Total: ${scannedPages.length + res.assets.length}`);
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not pick images from gallery');
    }
  }

  function handleDone() {
    if (scannedPages.length === 0) {
      Alert.alert('No Pages Scanned', 'Please scan or capture at least 1 page before proceeding.');
      return;
    }
    onScanComplete(scannedPages);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" style={{ color: theme.text, fontSize: 16 }}>
                📷 {title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Scanner Simulation Viewport */}
          <View style={[styles.cameraFrame, { borderColor: theme.tint, backgroundColor: '#000000' }]}>
            {/* Live scanning overlay frame */}
            <View style={[styles.scanReticle, { borderColor: theme.tint }]}>
              <View style={[styles.corner, styles.topRight, { borderColor: theme.tint }]} />
              <View style={[styles.corner, styles.topLeft, { borderColor: theme.tint }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: theme.tint }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.tint }]} />

              <Ionicons name="scan-outline" size={48} color={theme.tint} style={{ opacity: 0.6 }} />
              
              <ThemedText type="smallBold" style={{ color: '#FFFFFF', marginTop: 12, textAlign: 'center' }}>
                {autoScanMessage || 'Align book page or notebook in frame'}
              </ThemedText>
              {autoTimer > 0 && timerRef.current ? (
                <View style={[styles.timerBadge, { backgroundColor: theme.tint }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 11 }}>
                    Auto Capturing in {autoTimer}s…
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          {/* Hands-Free Controller Action Row */}
          <View style={styles.controlRow}>
            <Pressable
              onPress={triggerAutoCapturePage}
              style={[styles.autoScanBtn, { backgroundColor: theme.tint }]}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 13 }}>
                Simulate Hands-Free Auto Capture
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={pickPageFromGallery}
              style={[styles.secondaryBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}
            >
              <Ionicons name="images-outline" size={18} color={theme.text} />
              <ThemedText type="small" style={{ color: theme.text, fontSize: 12 }}>
                Pick from Gallery
              </ThemedText>
            </Pressable>
          </View>

          {/* Scanned Pages Carousel Row */}
          {scannedPages.length > 0 ? (
            <View style={styles.scannedWrap}>
              <ThemedText type="smallBold" style={{ color: theme.text, marginBottom: 6 }}>
                Scanned Pages ({scannedPages.length}):
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {scannedPages.map((uri, idx) => (
                    <View key={idx} style={styles.pageThumbWrap}>
                      <Image source={{ uri }} style={styles.pageThumb} />
                      <View style={[styles.pageBadge, { backgroundColor: theme.tint }]}>
                        <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 10 }}>
                          P{idx + 1}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => setScannedPages(scannedPages.filter((_, i) => i !== idx))}
                        style={styles.deleteThumbBtn}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}

          {/* Complete Scanning Button */}
          <Pressable
            onPress={handleDone}
            style={[styles.doneBtn, { backgroundColor: scannedPages.length > 0 ? '#10B981' : theme.border }]}
            disabled={scannedPages.length === 0}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 14 }}>
              Process {scannedPages.length} Scanned Page(s) with AI Teacher
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  cameraFrame: {
    height: 220,
    borderRadius: Radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  scanReticle: {
    width: '85%',
    height: '80%',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 2,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  timerBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  controlRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  autoScanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: Radius.md,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: Radius.md,
  },
  scannedWrap: {
    marginBottom: Spacing.three,
  },
  pageThumbWrap: {
    width: 64,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  pageThumb: {
    width: '100%',
    height: '100%',
  },
  pageBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  deleteThumbBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.lg,
  },
});
