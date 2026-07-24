import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { PrincipalMessage } from '@/data/types';
import { Card } from '../ui/Card';
import { ThemedText } from '../ui/ThemedText';

interface PrincipalCardProps {
  principal: PrincipalMessage;
}

export function PrincipalCard({ principal }: PrincipalCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <Image source={{ uri: principal.photoUrl }} style={styles.photo} contentFit="cover" />
        <View style={styles.headerText}>
          <ThemedText type="smallBold">{principal.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {principal.role}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="default" style={styles.message}>
        {principal.message}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    marginRight: Spacing.three,
  },
  headerText: {
    flex: 1,
  },
  message: {
    lineHeight: 22,
  },
});
