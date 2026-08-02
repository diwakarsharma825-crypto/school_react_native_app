import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarFgPalette, AvatarPalette, Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';

const CONFETTI_COLORS = [Brand.blueLight, Brand.saffron, Brand.green, Brand.red, Brand.gold];
const CONFETTI_COUNT = 18;

function ConfettiBurst() {
  const pieces = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      anim: new Animated.Value(0),
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      delay: Math.random() * 250,
      drift: (Math.random() - 0.5) * 80,
    }))
  ).current;

  useEffect(() => {
    Animated.stagger(
      12,
      pieces.map((p) =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 1400 + Math.random() * 500,
          delay: p.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [pieces]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, 420] }) },
              { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              {
                rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + Math.random() * 360}deg`] }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

export default function AchieverDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    name: string;
    classLabel: string;
    position: string;
    score: string;
    total: string;
    percent: string;
    grade: string;
    photoUrl?: string;
    paletteIndex: string;
    showGrade: string;
  }>();

  const photoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(photoAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }),
      Animated.timing(textAnim, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.spring(badgeAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
    ]).start();
  }, [photoAnim, textAnim, badgeAnim]);

  const paletteIndex = Number(params.paletteIndex) || 0;
  const showGrade = params.showGrade === '1';

  return (
    <View style={[styles.screen, { backgroundColor: theme.tint }]}>
      <ConfettiBurst />

      <Pressable onPress={() => router.back()} style={[styles.backButton, { top: insets.top + Spacing.two }]} hitSlop={10}>
        <Ionicons name="close" size={22} color={Brand.white} />
      </Pressable>

      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: photoAnim,
            transform: [
              { scale: photoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              { rotate: photoAnim.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
            ],
          }}
        >
          {params.photoUrl ? (
            <Image source={{ uri: params.photoUrl }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.photoFallback, { backgroundColor: AvatarPalette[paletteIndex % AvatarPalette.length] }]}>
              <Ionicons name="person" size={56} color={AvatarFgPalette[paletteIndex % AvatarFgPalette.length]} />
            </View>
          )}
          <View style={styles.trophyCircle}>
            <ThemedText type="title">🏆</ThemedText>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: textAnim,
            transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            alignItems: 'center',
          }}
        >
          <ThemedText type="title" style={styles.congrats}>
            🎉 Congratulations! 🎉
          </ThemedText>
          <ThemedText type="title" style={styles.name}>
            {params.name}
          </ThemedText>
          <View style={styles.classRow}>
            <ThemedText type="default" style={styles.position}>
              {params.position}
            </ThemedText>
            <View style={styles.classBadge}>
              <ThemedText type="smallBold" style={styles.classBadgeLabel}>
                {params.classLabel}
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.scoreCard,
            {
              opacity: badgeAnim,
              transform: [{ scale: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            },
          ]}
        >
          {showGrade ? (
            <>
              <ThemedText type="small" style={styles.scoreCardLabel}>
                Grade
              </ThemedText>
              <ThemedText type="title" style={styles.scoreCardValue}>
                {params.grade}
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="small" style={styles.scoreCardLabel}>
                Score
              </ThemedText>
              <ThemedText type="title" style={styles.scoreCardValue}>
                {params.score} / {params.total}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.scoreCardPercent}>
                {params.percent}%
              </ThemedText>
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    right: Spacing.three,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.five,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Brand.white,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyCircle: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congrats: {
    color: Brand.white,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  name: {
    color: Brand.white,
    textAlign: 'center',
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  position: {
    color: 'rgba(255,255,255,0.85)',
  },
  classBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  classBadgeLabel: {
    color: Brand.white,
  },
  scoreCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.six ?? Spacing.five,
    alignItems: 'center',
    minWidth: 200,
  },
  scoreCardLabel: {
    color: Brand.blue,
    opacity: 0.7,
  },
  scoreCardValue: {
    color: Brand.blue,
  },
  scoreCardPercent: {
    color: Brand.blue,
    marginTop: 2,
  },
});
