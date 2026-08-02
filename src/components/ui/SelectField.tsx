import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Shows a search box at the top of the sheet and filters options
   * client-side as you type — used for longer lists like homework subjects. */
  searchable?: boolean;
}

/** Label + pressable "select" control that opens a bottom-sheet modal list —
 * shared by onboarding (class/stream/designation) and the Result screen
 * (session), so every dropdown in the app looks and behaves the same. */
export function SelectField({ label, placeholder, value, options, onChange, searchable }: SelectFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  return (
    <>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable onPress={() => setOpen(true)} style={[styles.select, { borderColor: theme.border }]}>
        <ThemedText type="default" themeColor={selected ? 'text' : 'textSecondary'}>
          {selected ? selected.label : placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setOpen(false);
          setQuery('');
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setOpen(false);
            setQuery('');
          }}
        >
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold" style={styles.sheetTitle}>
              {label}
            </ThemedText>
            {searchable ? (
              <View style={[styles.searchBox, { borderColor: theme.border }]}>
                <Ionicons name="search" size={16} color={theme.textSecondary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search…"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text }]}
                  autoFocus
                />
              </View>
            ) : null}
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyLabel}>
                  No matches.
                </ThemedText>
              ) : (
                filtered.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={[styles.row, { borderBottomColor: theme.border }]}
                  >
                    <ThemedText type="default">{option.label}</ThemedText>
                    {option.value === value ? <Ionicons name="checkmark" size={18} color={theme.tint} /> : null}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.one,
    marginTop: Spacing.three,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.two,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    maxHeight: '70%',
  },
  sheetTitle: {
    marginBottom: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.two,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  emptyLabel: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
