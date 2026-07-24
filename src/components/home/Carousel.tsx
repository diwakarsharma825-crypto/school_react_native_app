import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Banner } from '@/data/types';
import { ThemedText } from '../ui/ThemedText';

interface CarouselProps {
  banners: Banner[];
}

const AUTO_ADVANCE_MS = 4500;

export function Carousel({ banners }: CarouselProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const SLIDE_WIDTH = Math.min(screenWidth - Spacing.three * 2, 720 - Spacing.three * 2);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [banners.length, SLIDE_WIDTH]);

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setIndex(newIndex);
  }

  if (banners.length === 0) return null;

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
        {banners.map((banner) => (
          <View key={banner.id} style={[styles.slide, { width: SLIDE_WIDTH }]}>
            <Image source={{ uri: banner.imageUrl }} style={styles.image} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.overlay}
            >
              <ThemedText type="subtitle" style={styles.overlayTitle}>
                {banner.title}
              </ThemedText>
              {banner.subtitle ? (
                <ThemedText type="small" style={styles.overlaySubtitle}>
                  {banner.subtitle}
                </ThemedText>
              ) : null}
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((banner, i) => (
          <View
            key={banner.id}
            style={[
              styles.dot,
              { backgroundColor: i === index ? theme.accent : theme.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: 200,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
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
    marginTop: Spacing.half,
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
