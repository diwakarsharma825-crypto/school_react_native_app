import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

interface VideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  uri: string | null;
}

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls allowsPictureInPicture />;
}

/** Full-screen in-app video playback — used wherever a stored video (event
 * media, etc.) needs to actually play, instead of showing a static
 * "videocam" placeholder icon with no playback action. */
export function VideoPlayerModal({ visible, onClose, uri }: VideoPlayerModalProps) {
  if (!uri) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        {visible ? <Player uri={uri} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.four,
    zIndex: 10,
    padding: Spacing.two,
  },
});
