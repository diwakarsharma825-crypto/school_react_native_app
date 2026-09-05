import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { FullImageViewerModal } from '@/components/ui/FullImageViewerModal';
import { EmptyState, Loading } from '@/components/ui/states';
import { Screen } from '@/components/ui/Screen';
import { SectionUnavailable } from '@/components/ui/SectionUnavailable';
import { ThemedText } from '@/components/ui/ThemedText';
import { ClassmateItem, fetchStudentClassmatesApi } from '@/data/homework-api';
import { useSectionEnabled } from '@/hooks/use-sections';
import { useStudentAuth } from '@/hooks/use-student-auth';
import { useTheme } from '@/hooks/use-theme';

export default function ClassmatesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const enabled = useSectionEnabled('classmates');
  const { checking, loggedIn, access } = useStudentAuth();

  const [classmates, setClassmates] = useState<ClassmateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{ uri: string; name: string } | null>(null);

  useEffect(() => {
    if (!loggedIn || !access?.className) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchStudentClassmatesApi(access.className, access.section, access.srn)
      .then(setClassmates)
      .catch(() => setClassmates([]))
      .finally(() => setLoading(false));
  }, [loggedIn, access]);

  if (!enabled) return <SectionUnavailable />;

  if (checking || loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading classmates…" />
      </Screen>
    );
  }

  if (!loggedIn || !access) {
    return (
      <Screen scroll={false}>
        <EmptyState
          message="Please log in as a student to view your classmates."
          icon="school-outline"
        />
      </Screen>
    );
  }

  const classLabel = access.className.toLowerCase().startsWith('class')
    ? `${access.className}${access.section ? ` - Section ${access.section}` : ''}`
    : `Class ${access.className}${access.section ? ` - Section ${access.section}` : ''}`;

  return (
    <Screen>
      {/* Header Info Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIconWrap, { backgroundColor: theme.tint + '1E' }]}>
            <Ionicons name="people-outline" size={24} color={theme.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={{ fontSize: 18 }}>
              My Classmates
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {classLabel} · {classmates.length} {classmates.length === 1 ? 'Student' : 'Students'}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Classmates Roster List */}
      {classmates.length === 0 ? (
        <EmptyState
          message={`No other classmates found in ${classLabel}.`}
          icon="people-outline"
        />
      ) : (
        <View style={{ gap: Spacing.two }}>
          {classmates.map((item) => (
            <Card key={String(item.id)} style={styles.classmateCard}>
              <View style={styles.itemRow}>
                {/* Photo Avatar */}
                <Pressable
                  onPress={() => {
                    if (item.photo_url) {
                      setSelectedPhoto({ uri: item.photo_url, name: item.name });
                    }
                  }}
                  style={styles.avatarWrap}
                >
                  {item.photo_url ? (
                    <Image
                      source={{ uri: item.photo_url }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: theme.dark ? theme.tint : theme.backgroundSelected }]}>
                      <Ionicons name="person" size={22} color={theme.dark ? '#FFFFFF' : theme.tint} />
                    </View>
                  )}
                </Pressable>

                {/* Name & Roll No ONLY */}
                <View style={styles.infoCol}>
                  <ThemedText type="smallBold" style={{ fontSize: 15 }}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 13, marginTop: 2 }}>
                    Roll No: {item.roll_no || '—'}
                  </ThemedText>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Full Screen Photo Viewer Modal */}
      <FullImageViewerModal
        visible={selectedPhoto !== null}
        imageUri={selectedPhoto?.uri ?? null}
        title={selectedPhoto?.name}
        onClose={() => setSelectedPhoto(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classmateCard: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
});
