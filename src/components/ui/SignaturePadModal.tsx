import React, { useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import SignatureCanvas, { SignatureViewRef } from 'react-native-signature-canvas';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export function SignaturePadModal({ visible, onClose, onSave }: Props) {
  const theme = useTheme();
  const ref = useRef<SignatureViewRef>(null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Draw Your Signature</ThemedText>
          <Pressable onPress={onClose} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="tint">
              Cancel
            </ThemedText>
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Sign with your finger in the box below, the same way you'd sign on paper.
        </ThemedText>
        <View style={[styles.canvasBox, { borderColor: theme.border }]}>
          <SignatureCanvas
            ref={ref}
            onOK={onSave}
            onEmpty={() => {}}
            descriptionText=""
            webStyle="body,html{height:100%; background-color:#ffffff !important;} .m-signature-pad{box-shadow:none;border:none;background-color:#ffffff;} .m-signature-pad--body{background-color:#ffffff;} .m-signature-pad--footer{display:none;}"
            backgroundColor="#ffffff"
            penColor="#0f172a"
            autoClear={false}
            // Android's dark-mode "force dark" algorithm auto-inverts WebView
            // content, turning the white canvas near-black and making the
            // signature invisible while drawing — this is the actual pen/
            // canvas colors, force-dark just overrides them at render time.
            webviewProps={{ forceDarkOn: false }}
          />
        </View>
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => ref.current?.clearSignature()}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
          >
            <ThemedText type="smallBold">Clear</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => ref.current?.readSignature()}
            style={[styles.primaryButton, { backgroundColor: theme.tint }]}
          >
            <ThemedText type="smallBold" style={styles.primaryButtonLabel}>
              Use This Signature
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.six,
    marginBottom: Spacing.two,
  },
  hint: {
    marginBottom: Spacing.three,
  },
  canvasBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  primaryButton: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  primaryButtonLabel: {
    color: Brand.white,
  },
});
