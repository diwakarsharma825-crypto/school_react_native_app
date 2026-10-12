import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useBrand } from '@/hooks/use-brand';
import { useTheme } from '@/hooks/use-theme';

const defaultLogo = require('../../../assets/images/icon.png');

export function LaunchScreen() {
  const scale = useRef(new Animated.Value(0.92)).current;
  const brand = useBrand();
  const theme = useTheme();

  const logoSource = brand.logoUrl ? { uri: brand.logoUrl } : defaultLogo;
  const splashBg = brand.splashColor || brand.primaryColor || theme.tint || Brand.blueDark;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [scale]);

  return (
    <View style={[styles.container, { backgroundColor: splashBg }]}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }] }]}>
        <Image
          source={logoSource}
          style={styles.logo}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blueDark,
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
});
