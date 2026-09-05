import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from './ThemedText';

interface FullImageViewerModalProps {
  visible: boolean;
  imageUri?: string | null;
  photoUrl?: string | null;
  title?: string;
  onClose: () => void;
}

export function FullImageViewerModal({
  visible,
  imageUri,
  photoUrl,
  title,
  onClose,
}: FullImageViewerModalProps) {
  const uri = imageUri || photoUrl;
  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Background Backdrop Tap to Close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Top Header Bar with Close Button */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            {title ? (
              <ThemedText type="smallBold" style={styles.titleText} numberOfLines={1}>
                {title}
              </ThemedText>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Center Image Content */}
        <View style={styles.imageContainer} pointerEvents="box-none">
          <Image
            source={{ uri }}
            style={styles.fullImage}
            contentFit="contain"
            transition={200}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
