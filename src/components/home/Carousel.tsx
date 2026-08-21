import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Slider } from '@/data/types';
import { ThemedText } from '../ui/ThemedText';

interface CarouselProps {
  sliders: Slider[];
}

const AUTO_ADVANCE_MS = 4500;

export function Carousel({ sliders }: CarouselProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const SLIDE_WIDTH = Math.min(screenWidth - Spacing.three * 2, 720 - Spacing.three * 2);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % sliders.length;
        scrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [sliders.length, SLIDE_WIDTH]);

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setIndex(newIndex);
  }

  if (sliders.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={{ width: SLIDE_WIDTH }}
      >
        {sliders.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width: SLIDE_WIDTH }]}>
            <Image
              source={{ uri: slide.image_url }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={250}
            />
            {slide.title || slide.subtitle ? (
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.overlay}>
                {slide.title ? (
                  <ThemedText type="subtitle" style={styles.overlayTitle}>
                    {slide.title}
                  </ThemedText>
                ) : null}
                {slide.subtitle ? (
                  <ThemedText type="small" style={styles.overlaySubtitle}>
                    {slide.subtitle}
                  </ThemedText>
                ) : null}
                <Pressable style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => router.push('/contact')}>
                  <ThemedText type="smallBold" style={styles.ctaText}>
                    Contact Us
                  </ThemedText>
                </Pressable>
              </LinearGradient>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {sliders.map((slide, i) => (
          <View
            key={slide.id}
            style={[styles.dot, { backgroundColor: i === index ? theme.accent : theme.border }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  badgeText: {
    color: Brand.blue,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.three,
  },
  overlayTitle: {
    color: '#fff',
  },
  overlaySubtitle: {
    color: '#fff',
    opacity: 0.9,
    marginTop: Spacing.half,
  },
  cta: {
    backgroundColor: Brand.saffron,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    marginTop: Spacing.two,
  },
  ctaText: {
    color: '#fff',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
