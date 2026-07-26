import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { Brand } from '@/constants/theme';

const logoSource = require('../../../assets/images/icon.png');

/** Shown while the app boots (app_status/onboarding checks in flight) — a
 * simple scale+fade entrance for the school logo instead of a bare spinner,
 * matching the "make app open feel alive" ask. Kept dependency-free (no
 * Lottie) since it only needs to run once for ~1s.
 *
 * NOTE: this used to combine two separate Animated.Values with
 * Animated.multiply() for the transform — that threw a native
 * "Illegal node ID set as an input for Animated.multiply node" exception on
 * some devices/RN versions and could hang the app on this very first
 * screen. Fixed by driving the entrance spring AND the pulse loop off the
 * same single Animated.Value instead — never combine two animated values
 * into one transform here again without testing on a real device first. */
export function LaunchScreen() {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.06,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [opacity, scale]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.Image source={logoSource} style={[styles.logo, { transform: [{ scale }] }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blueDark,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
});
