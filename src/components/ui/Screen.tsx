import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
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
      <View style={[styles.maxWidth, contentStyle]}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={edges ?? DEFAULT_EDGES}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
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
});
