import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import type { TrialStatus } from '@/data/app-status';
import { ThemedText } from './ThemedText';

const LAST_SHOWN_KEY = 'saarthak.trial_banner_last_shown';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Attractive once-per-day promo modal — remaining trial days computed
 * server-side from one shared start date, so it's consistent for every
 * user regardless of when they personally installed the app. Dismissing
 * with the ✕ just hides it for the rest of today; it reappears tomorrow. */
export function TrialBanner({ trial }: { trial: TrialStatus }) {
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trial.startDate) return;
    AsyncStorage.getItem(LAST_SHOWN_KEY).then((lastShown) => {
      if (lastShown !== todayStr()) {
        setVisible(true);
      }
    });
  }, [trial.startDate]);

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 65 }).start();
    }
  }, [visible, anim]);

  function dismiss() {
    AsyncStorage.setItem(LAST_SHOWN_KEY, todayStr()).catch(() => {});
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: anim,
              transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <ThemedText type="default" style={styles.badgeEmoji}>
                ✨
              </ThemedText>
              <ThemedText type="smallBold" style={styles.badgeText}>
                FREE TRIAL
              </ThemedText>
            </View>
            <Pressable onPress={dismiss} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Brand.white} />
            </Pressable>
          </View>

          <ThemedText type="title" style={styles.title}>
            {trial.ended ? 'Your free trial has ended' : `${trial.remainingDays} day${trial.remainingDays === 1 ? '' : 's'} left in your free trial!`}
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            {trial.ended
              ? 'Keep enjoying everything the app offers — thanks for trying it out!'
              : 'Enjoy full access to everything the school app has to offer:'}
          </ThemedText>

          {trial.features.length > 0 ? (
            <View style={styles.features}>
              {trial.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Brand.saffronLight} />
                  <ThemedText type="small" style={styles.featureText}>
                    {f}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable onPress={dismiss} style={styles.ctaButton}>
            <ThemedText type="smallBold" style={styles.ctaLabel}>
              Continue Exploring
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Brand.blue,
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeEmoji: {
    fontSize: 13,
  },
  badgeText: {
    color: Brand.white,
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    color: Brand.white,
    marginBottom: Spacing.two,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.three,
    lineHeight: 20,
  },
  features: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  featureText: {
    color: Brand.white,
    flex: 1,
  },
  ctaButton: {
    backgroundColor: Brand.saffron,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
  },
  ctaLabel: {
    color: Brand.white,
  },
});
