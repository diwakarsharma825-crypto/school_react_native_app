import React from 'react';
import { RefreshControl, StyleSheet, View, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

const MAX_CONTENT_WIDTH = 720;

// Every screen already sits below a custom header (AppHeader/TabHeader/
// DetailHeader) that reserves the top safe-area inset itself — applying it
// again here just adds a redundant gap between the header and content.
const DEFAULT_EDGES: Array<'top' | 'right' | 'bottom' | 'left'> = ['bottom', 'left', 'right'];

export function Screen({ children, refreshing = false, onRefresh, scroll = true, contentStyle, edges }: ScreenProps) {
  const theme = useTheme();

  const body = (
    <View style={styles.centerWrap}>
      {/* Non-scrolling screens (Loading/ErrorState/SectionUnavailable, etc.)
          often want to vertically center their content with flex:1 — that
          only works if this box actually fills the available height. In the
          scrolling case ScrollView's own contentContainerStyle handles
          sizing, so this stays auto-height there. */}
      <View style={[styles.maxWidth, !scroll && styles.maxWidthFill, contentStyle]}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={edges ?? DEFAULT_EDGES}>
      {scroll ? (
        // KeyboardAwareScrollView (react-native-keyboard-controller) auto-
        // scrolls the focused input above the keyboard. This app runs with
        // edge-to-edge enabled, under which Android's windowSoftInputMode=
        // adjustResize no longer resizes the window — so a plain ScrollView
        // had no room to scroll and inputs stayed hidden. This library reads
        // the keyboard frame directly and works on both platforms.
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={Spacing.five}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
            ) : undefined
          }
        >
          {body}
        </KeyboardAwareScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.five,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  maxWidth: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    padding: Spacing.three,
  },
  maxWidthFill: {
    flex: 1,
  },
});
