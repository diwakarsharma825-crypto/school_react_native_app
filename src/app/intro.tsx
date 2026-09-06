import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { InstituteOnboarding } from '@/components/onboarding/InstituteOnboarding';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useLayout } from '@/hooks/use-layout';

export default function IntroScreen() {
  const router = useRouter();
  const { instituteMode } = useLayout();

  function handleDone() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {instituteMode ? (
        <InstituteOnboarding onDone={handleDone} />
      ) : (
        <OnboardingFlow onDone={handleDone} />
      )}
    </View>
  );
}
