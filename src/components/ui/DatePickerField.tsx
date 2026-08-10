import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './ThemedText';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

interface DatePickerFieldProps {
  label: string;
  placeholder: string;
  value: string | null;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function DatePickerField({ label, placeholder, value, onChange, minDate, maxDate }: DatePickerFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const min = minDate ?? '1970-01-01';

  const initial = parseDate(value) ?? parseDate(min) ?? { y: new Date().getFullYear(), m: new Date().getMonth() + 1, d: 1 };
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);

  // Synchronize calendar view with the current value whenever opened or value changes
  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      if (parsed) {
        setViewYear(parsed.y);
        setViewMonth(parsed.m);
      }
    }
  }, [value, open]);

  const years = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const startYr = 1970;
    const endYr = currentYr + 5;
    const yrs: number[] = [];
    for (let y = endYr; y >= startYr; y--) {
      yrs.push(y);
    }
    return yrs;
  }, []);

  const days = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: startWeekday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setViewMonth(m);
    setViewYear(y);
  }

  const displayLabel = value
    ? (() => {
        const p = parseDate(value);
        if (!p) return value;
        return `${p.d} ${MONTH_NAMES[p.m - 1]} ${p.y}`;
      })()
    : null;

  return (
    <>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => {
          setShowYearSelector(false);
          setOpen(true);
        }}
        style={[styles.select, { borderColor: theme.border }]}
      >
        <ThemedText type="default" themeColor={displayLabel ? 'text' : 'textSecondary'}>
          {displayLabel ?? placeholder}
        </ThemedText>
        <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.headerRow}>
              <ThemedText type="smallBold" style={styles.sheetTitle}>
                {label}
              </ThemedText>
              <Pressable
                onPress={() => setShowYearSelector((prev) => !prev)}
                style={[styles.yearToggleButton, { backgroundColor: theme.backgroundSelected }]}
              >
                <ThemedText type="smallBold" themeColor="tint">
                  {showYearSelector ? 'Show Calendar' : 'Select Year'}
                </ThemedText>
                <Ionicons
                  name={showYearSelector ? 'calendar' : 'chevron-down'}
                  size={14}
                  color={theme.tint}
                />
              </Pressable>
            </View>

            {showYearSelector ? (
              <View style={styles.yearGridContainer}>
                <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
                  <View style={styles.yearGrid}>
                    {years.map((y) => {
                      const isSelectedYear = y === viewYear;
                      return (
                        <Pressable
                          key={y}
                          style={[
                            styles.yearChip,
                            { borderColor: theme.border },
                            isSelectedYear && { backgroundColor: theme.tint, borderColor: theme.tint },
                          ]}
                          onPress={() => {
                            setViewYear(y);
                            setShowYearSelector(false);
                          }}
                        >
                          <ThemedText
                            type="smallBold"
                            themeColor={isSelectedYear ? 'textOnBrand' : 'text'}
                          >
                            {y}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <>
                <View style={styles.calendarHeader}>
                  <Pressable onPress={() => changeMonth(-1)} hitSlop={8}>
                    <Ionicons name="chevron-back" size={20} color={theme.tint} />
                  </Pressable>

                  <Pressable
                    onPress={() => setShowYearSelector(true)}
                    style={styles.monthYearHeaderPressable}
                  >
                    <ThemedText type="smallBold">
                      {MONTH_NAMES[viewMonth - 1]} {viewYear}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={14} color={theme.tint} style={{ marginLeft: 4 }} />
                  </Pressable>

                  <Pressable onPress={() => changeMonth(1)} hitSlop={8}>
                    <Ionicons name="chevron-forward" size={20} color={theme.tint} />
                  </Pressable>
                </View>

                <View style={styles.weekdayRow}>
                  {WEEKDAY_LABELS.map((w, i) => (
                    <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.weekdayLabel}>
                      {w}
                    </ThemedText>
                  ))}
                </View>

                <View style={styles.grid}>
                  {days.map((day, i) => {
                    if (day === null) return <View key={i} style={styles.dayCell} />;
                    const dateStr = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
                    const disabled = dateStr < min || (!!maxDate && dateStr > maxDate);
                    const isSelected = dateStr === value;
                    return (
                      <Pressable
                        key={i}
                        style={styles.dayCell}
                        disabled={disabled}
                        onPress={() => {
                          onChange(dateStr);
                          setOpen(false);
                        }}
                      >
                        <View style={[styles.dayCircle, isSelected && { backgroundColor: theme.tint }]}>
                          <ThemedText
                            type="small"
                            themeColor={isSelected ? 'textOnBrand' : disabled ? 'textSecondary' : 'text'}
                            style={disabled ? styles.disabledText : undefined}
                          >
                            {day}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    width: '88%',
    maxWidth: 360,
    maxHeight: 460,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sheetTitle: {
    marginBottom: 0,
  },
  yearToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  monthYearHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledText: {
    opacity: 0.35,
  },
  yearGridContainer: {
    height: 280,
  },
  yearScrollView: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  yearChip: {
    width: '30%',
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
});
