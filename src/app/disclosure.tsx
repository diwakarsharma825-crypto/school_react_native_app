import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Loading } from '@/components/ui/states';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/use-theme';
import { fetchMandatoryDisclosure } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';
import { useSectionEnabled } from '@/hooks/use-sections';
import { MandatoryDisclosureDoc } from '@/data/types';

export default function DisclosureScreen() {
  const theme = useTheme();
  const enabled = useSectionEnabled('disclosure');
  const { data, loading, error, refetch } = useFetch(fetchMandatoryDisclosure);
  const [selected, setSelected] = useState<MandatoryDisclosureDoc | null>(null);

  if (!enabled) return <SectionUnavailable />;

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading documents…" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refetch}>
      {error ? (
        <ErrorState message="Could not load mandatory disclosure documents." onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <View>
          {data.map((doc) => (
            <Pressable key={doc.title} onPress={() => setSelected(doc)}>
              <Card style={styles.row}>
                <Image source={{ uri: doc.image_url }} style={styles.thumb} contentFit="cover" />
                <ThemedText type="default" style={styles.title}>
                  {doc.title}
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Card>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState message="No documents available." icon="document-outline" />
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.closeButton} onPress={() => setSelected(null)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {selected ? <Image source={{ uri: selected.image_url }} style={styles.fullImage} contentFit="contain" /> : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    marginRight: Spacing.three,
  },
  title: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
