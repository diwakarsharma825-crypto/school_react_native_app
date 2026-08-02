import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import type { EventMediaItem } from '@/data/types';

interface Slide {
  type: 'image' | 'video';
  url: string;
}

function buildSlides(coverMedia?: EventMediaItem | null, images?: string[]): Slide[] {
  const slides: Slide[] = [];
  if (coverMedia?.type === 'video') {
    slides.push({ type: 'video', url: coverMedia.url });
  }
  const imgs = images && images.length > 0 ? images : coverMedia?.type === 'image' ? [coverMedia.url] : [];
  imgs.forEach((url) => {
    if (!slides.some((s) => s.url === url)) {
      slides.push({ type: 'image', url });
    }
  });
  return slides;
}

function VideoSlide({ uri, width, onEnd }: { uri: string; width: number; onEnd: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener('playToEnd', onEnd);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return (
    <View style={{ width, height: '100%', backgroundColor: '#000' }}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
        allowsPictureInPicture
      />
    </View>
  );
}

/** Unified card/hero media display: a video (if the event has one) plays
 * first — muted, autoplay, with full native controls (play/pause, seek,
 * fullscreen) — then the carousel auto-advances into the swipeable photos
 * once it finishes. Users can also swipe or use the arrow buttons to move
 * between slides manually at any time. Falls back to a single static image
 * when there's exactly one photo and no video. */
export function EventMediaCarousel({
  coverMedia,
  images,
  fallbackUrl,
  style,
}: {
  coverMedia?: EventMediaItem | null;
  images?: string[];
  fallbackUrl?: string;
  style?: ViewStyle;
}) {
  const slides = buildSlides(coverMedia, images);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  function goTo(i: number) {
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    if (clamped !== index && width) {
      scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    }
    setIndex(clamped);
  }

  if (slides.length === 0) {
    return fallbackUrl ? (
      <View style={[style, styles.clip]}>
        <Image source={{ uri: fallbackUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </View>
    ) : null;
  }

  return (
    <View style={[style, styles.clip]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={32}
        >
          {slides.map((slide, i) =>
            slide.type === 'video' ? (
              <VideoSlide key={i} uri={slide.url} width={width} onEnd={() => goTo(index + 1)} />
            ) : (
              <Image key={i} source={{ uri: slide.url }} style={{ width, height: '100%' }} contentFit="cover" />
            )
          )}
        </ScrollView>
      ) : null}

      {slides.length > 1 ? (
        <>
          {index > 0 ? (
            <Pressable onPress={() => goTo(index - 1)} style={[styles.navButton, styles.navButtonLeft]} hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </Pressable>
          ) : null}
          {index < slides.length - 1 ? (
            <Pressable onPress={() => goTo(index + 1)} style={[styles.navButton, styles.navButtonRight]} hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </Pressable>
          ) : null}
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLeft: {
    left: 8,
  },
  navButtonRight: {
    right: 8,
  },
  dots: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 14,
  },
});
